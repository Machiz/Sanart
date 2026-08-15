"""
rag.py - RAG Multiturno con Entrevista Diagnóstica de Burnout y Conexión LLM

Orquesta la evaluación conversacional multiturno sobre burnout, aplicando anonimización,
búsqueda vectorial en Chroma DB y generación de preguntas exploratorias o informe final con Gemini.
"""

import os
import sys
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
try:
    from langchain_ollama import ChatOllama
except ImportError:
    ChatOllama = None

from src.privacy import anonymize_user_input, PrivacyScrubber
from src.burnout_test import MultiTurnBurnoutEvaluator


DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
OLLAMA_MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


def get_default_llm(temperature: float = 0.3) -> Optional[Any]:
    """
    Obtiene el LLM configurado prioritariamente por variables de entorno:
    1. USE_OLLAMA=1 (por defecto en .env) o proveedor Ollama (modelo open source local como llama3).
    2. GOOGLE_API_KEY (Gemini).
    """
    provider = os.getenv("LLM_PROVIDER", "").lower()
    use_ollama = os.getenv("USE_OLLAMA", "1").lower() in ["1", "true", "yes"]

    if (use_ollama or provider == "ollama") and ChatOllama is not None:
        try:
            return ChatOllama(
                model=OLLAMA_MODEL_NAME,
                base_url=OLLAMA_BASE_URL,
                temperature=temperature
            )
        except Exception as e:
            print(f"[ADVERTENCIA] No se pudo conectar con Ollama ({OLLAMA_MODEL_NAME}): {e}")

    if os.getenv("GOOGLE_API_KEY") and not use_ollama:
        try:
            return ChatGoogleGenerativeAI(
                model="gemini-3.5-flash",
                google_api_key=os.getenv("GOOGLE_API_KEY"),
                temperature=temperature
            )
        except Exception as e:
            print(f"[ADVERTENCIA] No se pudo conectar con Gemini: {e}")

    # Fallback automático a Ollama si está disponible por defecto sin API Key
    if ChatOllama is not None:
        try:
            return ChatOllama(
                model=OLLAMA_MODEL_NAME,
                base_url=OLLAMA_BASE_URL,
                temperature=temperature
            )
        except Exception as e:
            pass

    return None


INTERVIEW_PROMPT_TEMPLATE = """
Eres "Sanart RAG", un asistente virtual empático realizando una entrevista de evaluación conversacional sobre prevención del síndrome de Burnout.

Historial de la conversación hasta ahora:
{chat_history}

Último mensaje del usuario (Anonimizado):
{latest_user_input}

Dimensiones detectadas hasta el momento:
{detected_dimensions}

{mbi_section}

Instrucciones para este turno (turno actual: {turn_count}):
- Si AÚN NO se ha completado la entrevista (is_complete = {is_complete}):
  1. Muestra empatía hacia lo que el usuario compartió.
    2. Haz UNA pregunta de seguimiento amable y clara para explorar aspectos no mencionados, O SI ESTÁ ACTIVO EL CUESTIONARIO MBI, presenta de manera clara las 5 preguntas indicadas.
    3. Si short_response_detected = {short_response_detected}, NO repitas la misma pregunta textual del turno anterior. Reformula en formato concreto (por ejemplo con opciones cortas) o cambia a otra dimensión pendiente.
  3. No des aún la clasificación final a menos que el usuario lo solicite explicitamente.

- Si YA SE COMPLETÓ la entrevista (is_complete = true):
  1. Presenta la clasificación final del estado de Burnout: [VERDE] Bajo Riesgo, [AMARILLO] Riesgo Moderado, o [ROJO] Riesgo Alto.
  2. Sintetiza las dimensiones detectadas en todo el diálogo.
  3. Utiliza el contexto recuperado de la base de conocimiento para brindar recomendaciones prácticas y empáticas.
  4. Incluye la aclaración no médica.

Contexto recuperado de la base de conocimiento:
{context}

Respuesta del asistente Sanart:
"""

FINAL_REPORT_PROMPT_TEMPLATE = """
Eres "Sanart RAG", un asistente virtual empático.

Con base en todo el historial, genera un informe final claro y humano.

Historial de conversación:
{chat_history}

Estado analizado:
- Clasificación: {threshold_tag}
- Dimensiones detectadas: {detected_dimensions}
- Resumen: {summary}
- Recomendación base: {recommendation}

Contexto recuperado de la base de conocimiento:
{context}

Instrucciones:
1. Redacta una devolución final empática en español.
2. Resume hallazgos principales en pocas líneas.
3. Entrega recomendaciones prácticas accionables.
4. Incluye aclaración de que no reemplaza atención profesional.
"""


class BurnoutRAGSession:
    """Mantiene el estado de la sesión multiturno para un usuario."""

    def __init__(self, session_id: Optional[str] = None, max_turns: int = 3, require_closing_keyword: bool = False):
        self.session_id = session_id or PrivacyScrubber.generate_anonymous_session_id()
        self.evaluator = MultiTurnBurnoutEvaluator(
            max_interview_turns=max_turns,
            require_closing_keyword=require_closing_keyword
        )
        self.chat_history_formatted: List[str] = []

    def add_turn(self, raw_user_input: str, clean_user_input: str, assistant_response: str):
        self.evaluator.add_user_turn(clean_user_input)
        self.chat_history_formatted.append(f"Usuario: {clean_user_input}")
        self.chat_history_formatted.append(f"Asistente: {assistant_response}")

    def get_history_text(self) -> str:
        return "\n".join(self.chat_history_formatted)


class BurnoutRAGAgent:
    """Agente RAG Multiturno para evaluación conversacional de Burnout."""

    def __init__(self, db_path: str = DB_DIR):
        self.db_path = db_path
        self.embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
        self.vector_store = None
        self.retriever = None
        self._init_vector_store()

    def _init_vector_store(self):
        if os.path.exists(self.db_path):
            self.vector_store = Chroma(
                persist_directory=self.db_path,
                embedding_function=self.embeddings
            )
            self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})
        else:
            print("[ADVERTENCIA] No se encontró la base de datos vectorial. Ejecuta 'python -m src.ingest' primero.")

    def retrieve_context(self, query: str) -> str:
        if not self.retriever:
            return "No hay base de conocimiento disponible actualmente."
        docs = self.retriever.invoke(query)
        if not docs:
            return "Sin contexto específico disponible."
        return "\n\n".join([doc.page_content for doc in docs])

    def generate_final_assessment(
        self,
        session: BurnoutRAGSession,
        llm_instance: Optional[Any] = None
    ) -> str:
        """Genera un informe final usando todo el historial acumulado de la sesión."""
        state = session.evaluator.analyze_accumulated_state()
        narrative = session.evaluator.get_full_narrative()
        context = self.retrieve_context(narrative)
        detected = ", ".join(state["detected_dimensions"]) if state["detected_dimensions"] else "Ninguna"
        history_text = session.get_history_text() or "(Sin historial)"

        llm = llm_instance or get_default_llm(temperature=0.3)
        if llm:
            try:
                prompt = ChatPromptTemplate.from_template(FINAL_REPORT_PROMPT_TEMPLATE)
                chain = prompt | llm | StrOutputParser()
                return chain.invoke({
                    "chat_history": history_text,
                    "threshold_tag": state["threshold_tag"],
                    "detected_dimensions": detected,
                    "summary": state["summary"],
                    "recommendation": state["recommendation"],
                    "context": context,
                })
            except Exception as e:
                return f"Error en generación LLM del informe final: {e}"

        return (
            f"Informe final basado en la conversación:\n"
            f"Estado: {state['threshold_tag']}\n"
            f"Dimensiones detectadas: {detected}\n"
            f"Resumen: {state['summary']}\n"
            f"Recomendación: {state['recommendation']}\n\n"
            f"Guía de apoyo recuperada (RAG):\n{context}\n\n"
            f"Nota: Este resultado es orientativo y no reemplaza evaluación profesional."
        )

    def process_chat_turn(
        self, 
        session: BurnoutRAGSession, 
        raw_user_input: str, 
        llm_instance: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Procesa un turno de la conversación multiturno.
        """
        clean_input = anonymize_user_input(raw_user_input)
        evaluator = session.evaluator
        evaluator.add_user_turn(clean_input)
        
        state = evaluator.analyze_accumulated_state()
        context = self.retrieve_context(evaluator.get_full_narrative())
        short_response_detected = evaluator.is_short_or_ambiguous_response(clean_input)
        
        # Verificar activación del Cuestionario MBI (Riesgo Moderado / AMARILLO y turn_count > 3, mostrado 1 por 1)
        mbi_triggered = evaluator.should_trigger_mbi_questionnaire(state)
        current_mbi_info = evaluator.get_next_single_mbi_question() if mbi_triggered else None
        
        if mbi_triggered and current_mbi_info:
            q_num, total_q, single_q = current_mbi_info
            mbi_section = (
                f"\n[SECCIÓN ESPECIAL: CUESTIONARIO MBI ACTIVADO - PREGUNTA {q_num} DE {total_q}]\n"
                "El usuario se encuentra en Riesgo Moderado [AMARILLO] y ha conversado más de 3 turnos.\n"
                "INSTRUCCIÓN OBLIGATORIA: Presenta empáticamente ÚNICAMENTE la siguiente pregunta individual del Cuestionario Maslach (MBI) "
                "e invita al usuario a responderla indicando la frecuencia con que se identifica (0: Nunca a 6: Todos los días):\n"
                f"  📋 Pregunta MBI ({q_num}/{total_q}): {single_q}\n"
                "NOTA IMPORTANTE: NO muestres más de una pregunta en este turno. Solo presenta esta pregunta individual.\n"
            )
        else:
            mbi_section = ""

        llm = llm_instance or get_default_llm(temperature=0.3)

        history_text = session.get_history_text()
        
        response_text = None
        if llm:
            try:
                prompt = ChatPromptTemplate.from_template(INTERVIEW_PROMPT_TEMPLATE)
                chain = prompt | llm | StrOutputParser()
                response_text = chain.invoke({
                    "chat_history": history_text if history_text else "(Inicio de conversación)",
                    "latest_user_input": clean_input,
                    "detected_dimensions": ", ".join(state["detected_dimensions"]) if state["detected_dimensions"] else "Ninguna aún",
                    "mbi_section": mbi_section,
                    "turn_count": state["turn_count"],
                    "is_complete": str(state["is_complete"]).lower(),
                    "short_response_detected": str(short_response_detected).lower(),
                    "context": context
                })
            except Exception as e:
                print(f"[ADVERTENCIA] Error en generación LLM ({type(e).__name__}): {e}")
                # Si falló Gemini o el LLM principal, intentar Ollama como fallback secundario
                if ChatOllama is not None and not isinstance(llm, ChatOllama):
                    try:
                        fallback_llm = ChatOllama(model=OLLAMA_MODEL_NAME, base_url=OLLAMA_BASE_URL, temperature=0.3)
                        chain = prompt | fallback_llm | StrOutputParser()
                        response_text = chain.invoke({
                            "chat_history": history_text if history_text else "(Inicio de conversación)",
                            "latest_user_input": clean_input,
                            "detected_dimensions": ", ".join(state["detected_dimensions"]) if state["detected_dimensions"] else "Ninguna aún",
                            "mbi_section": mbi_section,
                            "turn_count": state["turn_count"],
                            "is_complete": str(state["is_complete"]).lower(),
                            "short_response_detected": str(short_response_detected).lower(),
                            "context": context
                        })
                    except Exception:
                        response_text = None

        if not response_text:
            # Modo Offline (Fallback seguro)
            if mbi_triggered and current_mbi_info:
                q_num, total_q, single_q = current_mbi_info
                response_text = (
                    f"He notado que estás experimentando una carga de tensión moderada (Riesgo Moderado [AMARILLO]). "
                    f"Para profundizar en tu evaluación, evaluaremos 5 preguntas del Cuestionario Maslach (MBI) una a una.\n\n"
                    f"📋 Pregunta MBI ({q_num} de {total_q}):\n"
                    f"👉 {single_q}\n\n"
                    f"(Indica tu frecuencia del 0: Nunca al 6: Todos los días)."
                )
            elif not state["is_complete"]:
                next_q = evaluator.suggest_next_question(state, last_user_input=clean_input)
                response_text = (
                    f"Entiendo lo que mencionas. Para evaluar mejor tu situación (Turno {state['turn_count']}):\n\n"
                    f"👉 {next_q}"
                )
            else:
                response_text = (
                    f"--- INFORME FINAL DE EVALUACIÓN DE BURNOUT ---\n"
                    f"ESTADO: {state['threshold_tag']}\n"
                    f"Dimensiones Identificadas: {', '.join(state['detected_dimensions'])}\n\n"
                    f"Diagnóstico: {state['summary']}\n"
                    f"Recomendación: {state['recommendation']}\n\n"
                    f"--- GUÍA DE APOYO RECUPERADA (RAG) ---\n"
                    f"{context}"
                )

        session.chat_history_formatted.append(f"Usuario: {clean_input}")
        session.chat_history_formatted.append(f"Asistente: {response_text}")

        return {
            "session_id": session.session_id,
            "turn_count": state["turn_count"],
            "is_complete": state["is_complete"],
            "clean_input": clean_input,
            "state": state,
            "mbi_triggered": mbi_triggered,
            "current_mbi_info": current_mbi_info,
            "context_retrieved": context,
            "response": response_text
        }


if __name__ == "__main__":
    print("--- Probando RAG Multiturno (Entrevista Diagnóstica) ---")
    agent = BurnoutRAGAgent()
    session = BurnoutRAGSession(max_turns=3)

    t1 = agent.process_chat_turn(session, "Hola, últimamente me siento muy cansado al terminar de trabajar.")
    print(f"\n[Turno 1]\n{t1['response']}")

    t2 = agent.process_chat_turn(session, "Además me cuesta dormir bien y siento irritabilidad con mis compañeros.")
    print(f"\n[Turno 2]\n{t2['response']}")

    t3 = agent.process_chat_turn(session, "Siento que nada de lo que hago en la empresa tiene impacto o sentido.")
    print(f"\n[Turno 3 - Informe Final]\n{t3['response']}")
