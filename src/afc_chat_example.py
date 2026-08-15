"""
afc_chat_example.py - Ejemplo de recomendación de Automatic Function Calling (AFC)

Demuestra el patrón recomendado por Google GenAI SDK:
Uso de Chat.send_message / Chat.send_message_stream en lugar de Models.generate_content.
"""

import os
from typing import Dict, Any

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None


def evaluate_burnout_risk_tool(exhaustion_level: int, workload_hours: int) -> Dict[str, Any]:
    """Herramienta de ejemplo para evaluar nivel de riesgo de burnout."""
    score = exhaustion_level * 1.5 + (workload_hours / 10.0)
    risk = "Alto" if score > 7 else "Moderado" if score > 4 else "Bajo"
    return {
        "calculated_score": score,
        "risk_level": risk,
        "recommendation": "Consultar profesional de salud" if risk == "Alto" else "Pausas activas"
    }


def demo_afc_with_chat():
    """Demostración de AFC utilizando el cliente oficial Google GenAI."""
    if not genai or not os.getenv("GOOGLE_API_KEY"):
        print("Para ejecutar este demo se requiere installar `google-genai` y configurar GOOGLE_API_KEY.")
        return

    client = genai.Client()

    # PATRÓN RECOMENDADO: Inicializar Chat con tools configurados
    chat = client.chats.create(
        model="gemini-3.5-flash",
        config=types.GenerateContentConfig(
            tools=[evaluate_burnout_risk_tool],
            temperature=0.2,
        )
    )

    # El envío por chat maneja el ciclo completo (Prompt -> FunctionCall -> Exec -> FunctionResponse -> Output)
    print("--- Probando Chat.send_message con AFC ---")
    res = chat.send_message(
        "Tengo un nivel de agotamiento de 8 sobre 10 y trabajo 55 horas a la semana. ¿Qué riesgo tengo?"
    )
    print("Respuesta:", res.text)

    # Ejemplo Streaming: Chat.send_message_stream
    print("\n--- Probando Chat.send_message_stream con AFC ---")
    stream = chat.send_message_stream(
        "¿Cuáles son las recomendaciones específicas según ese resultado?"
    )
    for chunk in stream:
        print(chunk.text, end="", flush=True)
    print("\n")


if __name__ == "__main__":
    demo_afc_with_chat()
