"""
app.py - Consola Interactiva Multiturno con Impresión de Resultados Finales
"""

import sys
import os
import json
import random

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from src.rag import BurnoutRAGAgent, BurnoutRAGSession


CLOSING_KEYWORDS = {
    "gracias",
    "muchas gracias",
    "ok gracias",
    "listo",
    "fin",
    "terminar",
    "ya está",
    "ya esta",
}

INITIAL_GREETINGS = [
    "¡Hola! Soy Sanart RAG. ¿Cómo te has sentido últimamente en tu trabajo o actividad diaria?",
    "Hola, soy Sanart RAG. Me alegra leerte. ¿Cómo te has sentido estos días en el trabajo?",
    "Bienvenido/a, soy Sanart RAG. Si te parece, cuéntame cómo te has estado sintiendo en tu rutina laboral.",
    "Hola, aquí Sanart RAG. ¿Qué tal has estado últimamente a nivel emocional y de energía en el trabajo?",
]


def print_final_results_summary(res: dict):
    """Imprime un bloque estructurado y limpio con los resultados finales de la evaluación."""
    state = res["state"]
    print("\n==================================================================")
    print("           📋 INFORME FINAL Y RESULTADOS DE EVALUACIÓN           ")
    print("==================================================================")
    print(f" 🆔 ID de Sesión Anónimo   : {res['session_id']}")
    print(f" 🏷️ Estado de Burnout      : {state['threshold_tag']}")
    print(f" 🧩 Dimensiones Detectadas  : {', '.join(state['detected_dimensions']) if state['detected_dimensions'] else 'Ninguna'}")
    print(f" 📝 Diagnóstico Rápido      : {state['summary']}")
    print(f" 💡 Recomendación Principal : {state['recommendation']}")
    print("==================================================================\n")


def main():
    print("==================================================================")
    print("    🌿 SANART - ENTREVISTA DIAGNÓSTICA RAG DE BURNOUT           ")
    print("==================================================================")
    print("El asistente mantendrá una conversación para explorar tu estado")
    print("físico, emocional y laboral, y hará el análisis cuando cierres.")
    print("Escribe con total libertad en lenguaje natural.")
    print("(Tus datos son anonimizados automáticamente).")
    print("Cuando quieras ver resultados, escribe 'gracias' o 'fin'.")
    print("Escribe 'salir' en cualquier momento para finalizar.")
    print("------------------------------------------------------------------\n")

    agent = BurnoutRAGAgent()
    session = BurnoutRAGSession(max_turns=12, require_closing_keyword=True)

    print(f"Asistente: {random.choice(INITIAL_GREETINGS)}")

    last_result = None

    while True:
        try:
            print("\nTu respuesta > ")
            user_input = input().strip()

            if not user_input:
                continue

            if user_input.lower() in ["salir", "exit", "quit"]:
                print("\nFinalizando sesión a solicitud del usuario...")
                if session.evaluator.turn_count > 0:
                    summary_state = session.evaluator.analyze_accumulated_state()
                    last_result = {
                        "session_id": session.session_id,
                        "turn_count": summary_state["turn_count"],
                        "state": summary_state
                    }
                    print_final_results_summary(last_result)
                break

            normalized_input = user_input.lower()
            if ("gracias" in normalized_input) or (normalized_input in CLOSING_KEYWORDS):
                print("\nCerrando conversación y generando análisis final...")
                if session.evaluator.turn_count == 0:
                    print("Aún no hay respuestas para analizar.")
                    break
                final_response = agent.generate_final_assessment(session)
                out_str = final_response.encode(sys.stdout.encoding or "utf-8", errors="replace").decode(sys.stdout.encoding or "utf-8")
                print(f"\nAsistente:\n{out_str}")
                summary_state = session.evaluator.analyze_accumulated_state()
                last_result = {
                    "session_id": session.session_id,
                    "turn_count": summary_state["turn_count"],
                    "state": summary_state
                }
                print_final_results_summary(last_result)
                break

            print("\n[Sanart RAG procesando y analizando relato...]")
            res = agent.process_chat_turn(session, user_input)
            last_result = res

            out_str = res["response"].encode(sys.stdout.encoding or "utf-8", errors="replace").decode(sys.stdout.encoding or "utf-8")
            print(f"\nAsistente:\n{out_str}")

            if res["is_complete"]:
                # Cierre automático solo para alertas de alto riesgo.
                print("\nSe detectaron señales de alerta alta. Se genera informe preventivo.")
                print_final_results_summary(res)
                break

        except (KeyboardInterrupt, EOFError):
            print("\n\nSesión interrumpida.")
            if session.evaluator.turn_count > 0:
                summary_state = session.evaluator.analyze_accumulated_state()
                last_result = {
                    "session_id": session.session_id,
                    "turn_count": summary_state["turn_count"],
                    "state": summary_state
                }
                print_final_results_summary(last_result)
            break


if __name__ == "__main__":
    main()
