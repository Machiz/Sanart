"""
burnout_test.py - Evaluación Multiturno e Entrevista Diagnóstica de Burnout

Permite una conversación interactiva multiturno donde el RAG hace preguntas de seguimiento
para explorar adecuadamente las 3 dimensiones del burnout antes de emitir la clasificación final.
"""

import random
from typing import Dict, Any, List, Optional, Tuple

EMOTIONAL_EXHAUSTION_KEYWORDS = [
    "agotad", "exhaust", "sin energ", "cansad", "no puedo m", "insomnio", 
    "fatiga", "sin fuerzas", "colaps", "drenad", "dolor de cabeza", "tensi", "sobrecarg", "sueño"
]

DEPERSONALIZATION_KEYWORDS = [
    "cract", "cral", "cinic", "cinismo", "molest", "rabia", "irritab", 
    "no me importa", "sin sentido", "distante", "aisla", "hart", "indiferent", "jefe", "compañer"
]

REDUCED_ACCOMPLISHMENT_KEYWORDS = [
    "frustrad", "fracas", "inutil", "no sirv", "incompetent", "bloquead", 
    "desmotivad", "improductiv", "incapaz", "no val", "logro", "meta"
]

HIGH_RISK_ALERTS = [
    "renunciar", "colapsar", "no puedo más", "ataque de panico", "ataque de pánico",
    "depresion", "depresión", "lloro", "desesperan", "auxilio", "salud mental"
]

SHORT_AMBIGUOUS_PHRASES = {
    "si", "sí", "no", "ok", "vale", "normal", "bien", "mal",
    "mas o menos", "más o menos", "ahi", "ahí", "mm", "mmm", "nose", "no se", "no sé"
}

# Cuestionario MBI (Maslach Burnout Inventory) - 22 ítems de OMINT
MBI_QUESTIONNAIRE_22 = [
    "1. Me siento emocionalmente agotado/a por mi trabajo.",
    "2. Me siento cansado al final de la jornada de trabajo.",
    "3. Cuando me levanto por la mañana y me enfrento a otra jornada de trabajo me siento fatigado.",
    "4. Tengo facilidad para comprender cómo se sienten las personas con las que trabajo.",
    "5. Creo que estoy tratando a algunas personas en mi trabajo como si fueran objetos impersonales.",
    "6. Siento que trabajar todo el día con personas supone un gran esfuerzo y me cansa.",
    "7. Creo que trato con mucha eficacia los problemas en mi trabajo.",
    "8. Siento que mi trabajo me está desgastando. Me siento quemado por mi trabajo.",
    "9. Creo que con mi trabajo estoy influyendo positivamente en la vida de los demás.",
    "10. Me he vuelto más insensible con la gente desde que ejerzo esta actividad.",
    "11. Pienso que este trabajo me está endureciendo emocionalmente.",
    "12. Me siento con mucha energía en mi trabajo.",
    "13. Me siento frustrado/a en mi trabajo.",
    "14. Creo que trabajo demasiado.",
    "15. No me preocupa realmente lo que les ocurra a algunas personas en mi entorno laboral.",
    "16. Trabajar directamente con personas me produce estrés.",
    "17. Siento que puedo crear con facilidad un clima agradable en mi entorno laboral.",
    "18. Me siento motivado después de trabajar en contacto con mi equipo o usuarios.",
    "19. Creo que consigo muchas cosas valiosas en este trabajo.",
    "20. Me siento acabado en mi trabajo, al límite de mis posibilidades.",
    "21. En mi trabajo trato los problemas emocionalmente con mucha calma.",
    "22. Creo que las personas a mi alrededor me culpan de algunos de sus problemas."
]



class MultiTurnBurnoutEvaluator:
    """Gestiona el acumulado del diálogo y determina el estado del proceso diagnóstico."""

    def __init__(self, max_interview_turns: int = 3, require_closing_keyword: bool = False):
        self.max_interview_turns = max_interview_turns
        self.require_closing_keyword = require_closing_keyword
        self.user_history: List[str] = []
        self.turn_count = 0
        
        # Estado para cuestionario MBI secuencial (1 por 1)
        self.mbi_selected_questions: List[str] = []
        self.mbi_current_index = 0
        self.mbi_triggered = False
        self.last_probe_dimension: Optional[str] = None

    def add_user_turn(self, user_text: str):
        """Registra un nuevo turno de respuesta del usuario."""
        self.user_history.append(user_text)
        self.turn_count += 1

    def get_full_narrative(self) -> str:
        """Concatena el historial completo de respuestas del usuario."""
        return "\n".join(self.user_history)

    def analyze_accumulated_state(self) -> Dict[str, Any]:
        """
        Analiza todo el texto acumulado del usuario en las 3 dimensiones del burnout.
        """
        full_text = self.get_full_narrative().lower()

        exhaustion_matches = [kw for kw in EMOTIONAL_EXHAUSTION_KEYWORDS if kw in full_text]
        depersonalization_matches = [kw for kw in DEPERSONALIZATION_KEYWORDS if kw in full_text]
        accomplishment_matches = [kw for kw in REDUCED_ACCOMPLISHMENT_KEYWORDS if kw in full_text]
        high_risk_matches = [kw for kw in HIGH_RISK_ALERTS if kw in full_text]

        detected_dimensions = []
        if len(exhaustion_matches) > 0:
            detected_dimensions.append("Agotamiento Emocional / Físico")
        if len(depersonalization_matches) > 0:
            detected_dimensions.append("Despersonalización / Cinismo")
        if len(accomplishment_matches) > 0:
            detected_dimensions.append("Sensación de Ineficacia / Frustración Profesional")

        severity_score = (
            len(exhaustion_matches) * 1.5 + 
            len(depersonalization_matches) * 1.5 + 
            len(accomplishment_matches) * 1.5 + 
            len(high_risk_matches) * 3
        )

        # Clasificación del umbral
        if len(high_risk_matches) >= 2 or severity_score >= 6 or (len(detected_dimensions) == 3 and severity_score >= 4):
            level = "Alto Riesgo"
            threshold_tag = "[ROJO] Riesgo Alto de Burnout"
            summary = "Relato acumulado muestra agotamiento severo, fatiga crítica o señales de alerta."
            recommendation = "Se sugiere buscar orientación profesional o hablar con gestión de salud ocupacional."
        elif severity_score >= 2 or len(detected_dimensions) >= 1:
            level = "Riesgo Moderado"
            threshold_tag = "[AMARILLO] Riesgo Moderado de Burnout"
            summary = "Se identifican señales de tensión acumulada o insatisfacción laboral."
            recommendation = "Aplicar pausas activas, desconexión digital y comunicar límites de carga de trabajo."
        else:
            level = "Bajo Riesgo"
            threshold_tag = "[VERDE] Bajo Riesgo / Estado Saludable"
            summary = "No se observan patrones críticos de agotamiento."
            recommendation = "Mantener hábitos saludables de equilibrio laboral y personal."

        if self.require_closing_keyword:
            # En modo conversacional libre, solo se fuerza cierre por alertas altas.
            is_complete = len(high_risk_matches) >= 2
        else:
            is_complete = (self.turn_count >= self.max_interview_turns) or (len(high_risk_matches) >= 2) or (len(detected_dimensions) == 3)

        return {
            "turn_count": self.turn_count,
            "max_turns": self.max_interview_turns,
            "is_complete": is_complete,
            "detected_dimensions": detected_dimensions,
            "missing_dimensions": self._get_missing_dimensions(detected_dimensions),
            "severity_score": severity_score,
            "status": level,
            "threshold_tag": threshold_tag,
            "summary": summary,
            "recommendation": recommendation
        }

    def _get_missing_dimensions(self, detected: List[str]) -> List[str]:
        all_dims = [
            "Agotamiento Emocional / Físico",
            "Despersonalización / Cinismo",
            "Sensación de Ineficacia / Frustración Profesional"
        ]
        return [d for d in all_dims if d not in detected]

    def _contains_burnout_signals(self, text: str) -> bool:
        lowered = text.lower()
        all_keywords = (
            EMOTIONAL_EXHAUSTION_KEYWORDS
            + DEPERSONALIZATION_KEYWORDS
            + REDUCED_ACCOMPLISHMENT_KEYWORDS
            + HIGH_RISK_ALERTS
        )
        return any(kw in lowered for kw in all_keywords)

    def is_short_or_ambiguous_response(self, user_text: Optional[str]) -> bool:
        """Detecta respuestas muy cortas o ambiguas tipo 'más o menos'."""
        if not user_text:
            return False

        normalized = " ".join(user_text.lower().strip().split())
        tokens = normalized.split()

        if normalized in SHORT_AMBIGUOUS_PHRASES:
            return True

        if len(tokens) <= 3 and not self._contains_burnout_signals(normalized):
            return True

        return False

    def suggest_next_question(self, state: Dict[str, Any], last_user_input: Optional[str] = None) -> str:
        """Genera una pregunta de seguimiento exploratoria enfocada en áreas no mencionadas."""
        missing = state["missing_dimensions"]
        if not missing:
            return "¿Hay algún otro aspecto de tu entorno laboral o personal que sientas que influye en tu bienestar?"

        short_ambiguous = self.is_short_or_ambiguous_response(last_user_input)
        target_dimension = missing[0]

        # Evita repetir literalmente la misma dimensión si la respuesta previa fue ambigua.
        if short_ambiguous and self.last_probe_dimension == target_dimension and len(missing) > 1:
            target_dimension = missing[1]

        self.last_probe_dimension = target_dimension

        if target_dimension == "Agotamiento Emocional / Físico":
            if short_ambiguous:
                return "Para ubicar mejor tu energía: ¿dirías que esta semana fue alta, media o baja? ¿Y tu sueño fue reparador o interrumpido?"
            return "¿Cómo ha estado tu nivel de energía física y la calidad de tu sueño en las últimas semanas?"

        if target_dimension == "Despersonalización / Cinismo":
            if short_ambiguous:
                return "En el trabajo, ¿te has sentido más cercano/a al equipo, neutral, o distante/irritable en estos días?"
            return "¿Cómo te sientes respecto a la relación con tu equipo de trabajo o la motivación hacia tus tareas diarias?"

        if target_dimension == "Sensación de Ineficacia / Frustración Profesional":
            if short_ambiguous:
                return "En una frase corta: ¿sientes que lo que haces aporta resultados (sí, a veces, o no)?"
            return "¿Sientes que tus esfuerzos en el trabajo son valorados y producen los resultados que esperas?"

        return "¿Hay algún otro aspecto de tu entorno laboral o personal que sientas que influye en tu bienestar?"

    def should_trigger_mbi_questionnaire(self, state: Dict[str, Any]) -> bool:
        """
        Determina si se debe aplicar o continuar el cuestionario MBI una a una:
        - Escala en AMARILLO (Riesgo Moderado) y más de 3 turnos (turn_count > 3),
        - O la secuencia de 5 preguntas ya inició y aún no ha concluido.
        """
        is_yellow = state.get("status") == "Riesgo Moderado" or "[AMARILLO]" in state.get("threshold_tag", "")

        # Si ya se activó y aún quedan preguntas por presentar de la serie de 5
        if self.mbi_triggered and self.mbi_current_index < len(self.mbi_selected_questions):
            return True

        # Primera activación
        if is_yellow and self.turn_count > 3 and not self.mbi_triggered:
            return True

        return False

    def get_next_single_mbi_question(self) -> Optional[Tuple[int, int, str]]:
        """
        Selecciona (si es el inicio) 5 preguntas aleatorias y entrega LA SIGUIENTE pregunta individual
        en formato (número_pregunta, total_preguntas, texto_pregunta).
        """
        if not self.mbi_selected_questions:
            k = min(5, len(MBI_QUESTIONNAIRE_22))
            self.mbi_selected_questions = random.sample(MBI_QUESTIONNAIRE_22, k)
            self.mbi_triggered = True
            self.mbi_current_index = 0

        if self.mbi_current_index < len(self.mbi_selected_questions):
            current_q = self.mbi_selected_questions[self.mbi_current_index]
            q_num = self.mbi_current_index + 1
            total_q = len(self.mbi_selected_questions)
            self.mbi_current_index += 1
            return (q_num, total_q, current_q)

        return None

    def get_random_mbi_questions(self, count: int = 5) -> List[str]:
        """Obtiene un máximo de `count` preguntas elegidas al azar de la lista MBI de 22 ítems."""
        k = min(count, len(MBI_QUESTIONNAIRE_22))
        return random.sample(MBI_QUESTIONNAIRE_22, k)




if __name__ == "__main__":
    evaluator = MultiTurnBurnoutEvaluator(max_interview_turns=3)
    evaluator.add_user_turn("Me siento muy agotado y con dolor de cabeza todos los días.")
    st1 = evaluator.analyze_accumulated_state()
    print("Turno 1 - Estado:", st1["threshold_tag"])
    print("Pregunta sugerida:", evaluator.suggest_next_question(st1))
