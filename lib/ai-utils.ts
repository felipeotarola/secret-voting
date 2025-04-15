"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

interface PollOption {
  text: string
}

interface GeneratedPollContent {
  question: string
  description: string
  options: PollOption[]
}

export async function generatePollContent(title: string): Promise<GeneratedPollContent> {
  try {
    const prompt = `
    Generate content for a poll with the title: "${title}".
    
    The response should be in JSON format with the following structure:
    {
      "question": "A clear question based on the title",
      "description": "A brief description providing context for the poll (2-3 sentences)",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
    }
    
    Make sure the question is engaging and clear.
    The description should provide context but be concise.
    Generate 4-6 realistic options that people would choose between.
    If the title suggests a specific type of poll (e.g., preference, opinion, decision), tailor the options accordingly.
    
    Return ONLY the JSON object, nothing else.
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
      maxTokens: 500,
    })

    // Parse the response
    const cleanedText = text.trim()
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
    const jsonString = jsonMatch ? jsonMatch[0] : cleanedText

    const parsedResponse = JSON.parse(jsonString)

    // Convert string array to PollOption array
    const options = Array.isArray(parsedResponse.options)
      ? parsedResponse.options.map((option: string) => ({ text: option }))
      : []

    return {
      question: parsedResponse.question || title,
      description: parsedResponse.description || "",
      options: options.length > 0 ? options : [{ text: "" }, { text: "" }],
    }
  } catch (error) {
    console.error("Error generating poll content:", error)
    // Return default values if generation fails
    return {
      question: title,
      description: "",
      options: [{ text: "" }, { text: "" }],
    }
  }
}
