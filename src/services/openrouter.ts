
export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor(apiKey?: string) {
    // User will need to provide their own OpenRouter API key
    this.apiKey = apiKey || localStorage.getItem("openrouter_api_key") || "";
  }

  async extractFieldsFromImage(
    imageUrl: string,
    userPrompt?: string
  ): Promise<string> {
    try {
      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lovable.dev",
        "X-Title": "OCI Document Field Extractor",
      };

      const prompt = userPrompt
        ? `Extract all the fields and values from this document. ${userPrompt}`
        : "Analyze this image in extreme detail. If it shows a vehicle with damage, provide an elaborate, comprehensive assessment of all visible damage including: specific body parts affected (hood, fender, bumper, doors, windows, etc.), severity of each damage (minor scratches, moderate dents, severe crushing, etc.), paint condition, structural integrity concerns, estimated repair complexity, and any safety implications. If it's a document, extract ALL visible text fields and values. CRITICAL: For ANY document containing Arabic text - translate EVERYTHING including titles, headers, field names, and values. Display each Arabic text element in its original Arabic followed immediately by accurate English translation in parentheses. Format as 'Arabic Text (English Translation)'. Every single Arabic character, word, phrase, title, header, field name, and value MUST be translated. Do not leave any Arabic text untranslated. Provide detailed, professional analysis without code blocks or programming syntax.";

      const body = JSON.stringify({
        model: "meta-llama/llama-4-maverick",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 1024,
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: headers,
        body: body,
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error("OpenRouter API Error:", errorBody);
        throw new Error(
          `OpenRouter API Error: ${response.status} - ${
            errorBody.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      const messageContent = data.choices[0].message.content;
      return messageContent;
    } catch (error: any) {
      console.error("Error in extractFieldsFromImage:", error);
      throw new Error(
        error.message || "Failed to extract fields from the document."
      );
    }
  }

  async sendMessage(messages: OpenRouterMessage[]): Promise<string> {
    try {
      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-website.com", // Replace with your actual domain
        "X-Title": "Document Field Extractor", // Replace with your app name
      };

      const body = JSON.stringify({
        model: "meta-llama/llama-4-maverick",
        messages: messages,
        max_tokens: 1024,
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: headers,
        body: body,
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error("OpenRouter API Error:", errorBody);
        throw new Error(
          `OpenRouter API Error: ${response.status} - ${
            errorBody.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      const messageContent = data.choices[0].message.content;
      return messageContent;
    } catch (error: any) {
      console.error("Error in sendMessage:", error);
      throw new Error(error.message || "Failed to send message.");
    }
  }
}
