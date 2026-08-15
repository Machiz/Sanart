"""
test_mbi_trigger.py - Test script para verificar la entrega secuencial (1 a 1) de preguntas MBI
"""

import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from src.rag import BurnoutRAGAgent, BurnoutRAGSession


def test_mbi_sequential_activation():
    print("--- INICIANDO PRUEBA DE ACTIVACIÓN MBI SECUENCIAL (1 POR 1) ---")
    agent = BurnoutRAGAgent()
    session = BurnoutRAGSession(max_turns=12, require_closing_keyword=True)

    # Simular turnos que mantienen la escala en AMARILLO (Riesgo Moderado)
    user_inputs = [
        "Me siento cansado al terminar la jornada de trabajo.",                  # Turno 1
        "A veces me siento un poco frustrado con algunas tareas.",              # Turno 2
        "Me cuesta un poco concentrarme en la tarde por la tensión.",           # Turno 3
        "Siento que la rutina me exige esfuerzo pero sigo adelante.",            # Turno 4 -> Pregunta MBI 1 de 5
        "Respondo 4 a esa pregunta.",                                           # Turno 5 -> Pregunta MBI 2 de 5
        "Respondo 3 a la segunda.",                                             # Turno 6 -> Pregunta MBI 3 de 5
        "Respondo 5 a la tercera.",                                             # Turno 7 -> Pregunta MBI 4 de 5
        "Respondo 2 a la cuarta.",                                              # Turno 8 -> Pregunta MBI 5 de 5
        "Respondo 4 a la quinta pregunta final."                                # Turno 9 -> MBI Completado
    ]

    for idx, u_input in enumerate(user_inputs, 1):
        res = agent.process_chat_turn(session, u_input)
        state = res["state"]
        mbi_trig = res.get("mbi_triggered", False)

        print(f"\n Turno {idx} | Estado: {state['threshold_tag']} | MBI Activado: {mbi_trig}")
        print(f" Respuesta Asistente:\n{res['response']}")

        # Verificaciones
        if idx <= 3:
            assert not mbi_trig, f"Error: MBI se activó prematuramente en el turno {idx}."
        elif 4 <= idx <= 8:
            assert mbi_trig, f"Error: MBI debería estar activo en el turno {idx} (mostrando pregunta 1 por 1)."
            q_num = idx - 3
            assert f"Pregunta MBI ({q_num} de 5)" in res["response"] or f"Pregunta MBI ({q_num}/5)" in res["response"], \
                f"Error: Se esperaba la pregunta {q_num} de 5 en el turno {idx}."
        elif idx >= 9:
            assert not mbi_trig, "Error: MBI debería finalizar tras la 5ª pregunta."

    print("\n✅ TODAS LAS PRUEBAS DE ACTIVACIÓN SECUENCIAL (1 A 1) PASARON CORRECTAMENTE.")


if __name__ == "__main__":
    test_mbi_sequential_activation()
