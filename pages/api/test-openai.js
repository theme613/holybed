import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Simple test to verify API key works
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Hello! Just respond with 'API key is working correctly.'"
        }
      ],
      max_tokens: 20
    });

    const response = completion.choices[0].message.content;
    
    res.status(200).json({
      success: true,
      message: 'OpenAI API is working correctly',
      response: response,
      model: completion.model,
      usage: completion.usage
    });

  } catch (error) {
    console.error('OpenAI API test error:', error);
    
    res.status(500).json({
      success: false,
      message: 'OpenAI API test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
