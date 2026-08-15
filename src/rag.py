"""
rag.py - RAG Multiturno con Entrevista Diagnóstica de Burnout y Conexión LLM

Orquesta la evaluación conversacional multiturno sobre burnout, aplicando anonimización,
búsqueda vectorial en Chroma DB y generación de preguntas exploratorias o informe final con llama3.1 (Ollama).
"""

import os
import sys
import random
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
try:
    from langchain_ollama import ChatOllama
except ImportError:
    ChatOllama = None

from src.privacy import anonymize_user_input, PrivacyScrubber
from src.burnout_test import MultiTurnBurnoutEvaluator


DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
OLLAMA_MODEL_NAME = "llama3.1"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

NATURAL_OPENINGS = [
    "Gracias por compartirlo.",
    "Te entiendo.",
    "Aprecio que lo cuentes.",
    "Gracias por abrirte con esto.",
    "Tiene sentido lo que comentas.",
]

REPETITIVE_OPENING_PREFIXES = (
    "lo siento mucho",
    "siento mucho",
    "lamento mucho",
)


def get_default_llm(temperature: float = 0.3) -> Optional[Any]:
    """
    Obtiene exclusivamente el LLM local Ollama con modelo llama3.1.
    """
    if ChatOllama is not None:
        try:
            return ChatOllama(
                model=OLLAMA_MODEL_NAME,
                base_url=OLLAMA_BASE_URL,
                temperature=temperature
            )
        except Exception as e:
            print(f"[ADVERTENCIA] No se pudo conectar con Ollama ({OLLAMA_MODEL_NAME}): {e}")

    return None


INTERVIEW_PROMPT_TEMPLATE = """
Eres Sanarte, un asistente virtual empático para el personal del INSN San Borja.
Tu objetivo es escuchar, acompañar y guiar con un estilo cálido y cercano.

REGLAS DE CONVERSACIÓN:
1. Habla de forma natural y humana, como una conversación real, evitando frases robóticas o muy técnicas.
2. NUNCA repitas exactamente la misma pregunta o frase del turno anterior; reformula o cambia de enfoque.
3. Responde breve (2 a 5 líneas), con empatía y claridad.
4. Si la respuesta del usuario es corta o ambigua, pide precisión con opciones simples (por ejemplo: "alta/media/baja").
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
    2. Haz UNA pregunta de seguimiento amable y clara para explorar aspectos no mencionados, O SI ESTÁ ACTIVO EL CUESTIONARIO MBI, presenta únicamente la pregunta individual indicada.
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

    def _get_last_assistant_message(self, session: BurnoutRAGSession) -> Optional[str]:
        for line in reversed(session.chat_history_formatted):
            if line.startswith("Asistente: "):
                return line[len("Asistente: "):].strip()
        return None

    def _normalize_lead(self, text: str) -> str:
        lead = text.strip().lower().split("\n")[0]
        for separator in [".", ",", ":", "!", "?"]:
            lead = lead.split(separator)[0]
        return " ".join(lead.split())

    def _rewrite_repetitive_opening(self, response_text: str, last_assistant: Optional[str]) -> str:
        if not response_text:
            return response_text

        stripped = response_text.strip()
        if not stripped:
            return response_text

        normalized_current = self._normalize_lead(stripped)
        normalized_last = self._normalize_lead(last_assistant) if last_assistant else ""

        must_rewrite = any(normalized_current.startswith(prefix) for prefix in REPETITIVE_OPENING_PREFIXES)
        if normalized_last and normalized_current and normalized_current == normalized_last:
            must_rewrite = True

        if not must_rewrite:
            return response_text

        replacement_opening = random.choice(NATURAL_OPENINGS)
        parts = stripped.split("\n", 1)
        remainder = parts[1] if len(parts) > 1 else ""

        if remainder:
            return f"{replacement_opening}\n{remainder}".strip()

        return replacement_opening

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
                response_text = None

        if not response_text:
            # Modo Offline (Fallback seguro)
            if mbi_triggered and current_mbi_info:
                q_num, total_q, single_q = current_mbi_info
                response_text = (
                    f"Gracias por compartirlo. Veo señales de tensión moderada y quiero entenderte mejor con unas preguntas breves del MBI.\n\n"
                    f"📋 Pregunta MBI ({q_num} de {total_q}):\n"
                    f"👉 {single_q}\n\n"
                    f"Si te sirve, responde con una frecuencia de 0 (Nunca) a 6 (Todos los días)."
                )
            elif not state["is_complete"]:
                next_q = evaluator.suggest_next_question(state, last_user_input=clean_input)
                response_text = (
                    f"Gracias por contármelo.\n\n"
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

            last_assistant = self._get_last_assistant_message(session)
            response_text = self._rewrite_repetitive_opening(response_text, last_assistant)

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
