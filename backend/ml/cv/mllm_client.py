import base64
from typing import Literal, TypeVar

from openai import AsyncOpenAI
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

Role = Literal["user", "assistant"]


class MLLMClient:
    def __init__(
        self,
        system_prompt: str,
        model: str,
        client: AsyncOpenAI,
    ) -> None:
        self._system_prompt = system_prompt
        self._model = model
        self._client = client
        self._history: list[dict] = []

    def append_message(self, content: str, role: Role = "user") -> None:
        self._history.append({"role": role, "content": content})

    def append_image(
        self,
        image: bytes,
        text: str | None = None,
        mime: str = "image/png",
    ) -> None:
        b64 = base64.b64encode(image).decode("ascii")
        parts: list[dict] = []
        if text is not None:
            parts.append({"type": "text", "text": text})
        parts.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime};base64,{b64}"},
            }
        )
        self._history.append({"role": "user", "content": parts})

    def clear_history(self) -> None:
        self._history.clear()

    def _messages(self) -> list[dict]:
        return [{"role": "system", "content": self._system_prompt}, *self._history]

    async def get_response(self) -> str:
        resp = await self._client.chat.completions.create(
            model=self._model,
            messages=self._messages(),
        )
        content = resp.choices[0].message.content or ""
        self._history.append({"role": "assistant", "content": content})
        return content

    async def get_structured_response(self, schema: type[T]) -> T:
        resp = await self._client.beta.chat.completions.parse(
            model=self._model,
            messages=self._messages(),
            response_format=schema,
        )
        message = resp.choices[0].message
        if message.refusal:
            raise RuntimeError(f"Model refused: {message.refusal}")
        self._history.append({"role": "assistant", "content": message.content or ""})
        assert message.parsed is not None
        return message.parsed


if __name__ == "__main__":
    import asyncio
    import os

    from dotenv import load_dotenv

    class Character(BaseModel):
        name: str
        role: str

    async def _smoke_test() -> None:
        load_dotenv()
        openai_client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
        client = MLLMClient(
            system_prompt="You are a concise assistant. Respond with JSON when asked.",
            model="gpt-5.4-mini",
            client=openai_client,
        )

        client.append_message("Reply with a single word greeting.")
        print("free-form:", await client.get_response())

        client.clear_history()
        client.append_message(
            "The knight Aldric met the witch Vela at the inn. "
            "Return one character as JSON."
        )
        parsed = await client.get_structured_response(Character)
        print("structured:", parsed)

    asyncio.run(_smoke_test())
