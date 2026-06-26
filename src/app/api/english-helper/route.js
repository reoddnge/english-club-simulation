import { Ollama } from "ollama";

const client = new Ollama({
  host: "https://ollama.com",
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`
  }
});

export async function POST(req){

  try{

    const {
      question,
      role,
      world
    } = await req.json();

    const response = await client.chat({

      model:"glm-5.2:cloud",

      messages:[

        {
          role:"system",
          content:`
You are an English helper inside The Crate simulation game.

Student role:
${role}

World:
${world}

Help the student speak English naturally.

Rules:
- Give short practical answers.
- Give example sentences.
- Correct mistakes politely.
- Focus on real simulation situations.
`
        },

        {
          role:"user",
          content:question
        }

      ]

    });

    return Response.json({
      answer: response.message.content
    });

  } catch(error){

    console.error("OLLAMA CLOUD ERROR:", error);

    return Response.json(
      { answer:"AI unavailable" },
      { status:500 }
    );
  }
}