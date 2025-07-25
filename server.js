const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors({
  origin: ['https://pookubeh.web.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// הגדרת פונקציות שהבוט יכול "להפעיל"
const functions = [
  {
    name: 'changeProductPrice',
    description: 'שינוי מחיר של מוצר',
    parameters: {
      type: 'object',
      properties: {
        productName: { type: 'string', description: 'שם המוצר' },
        newPrice: { type: 'number', description: 'המחיר החדש' }
      },
      required: ['productName', 'newPrice']
    }
  },
  {
    name: 'activateEmergencyMode',
    description: 'הפעלת מצב חירום עם הודעה',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'הודעת החירום' }
      },
      required: ['message']
    }
  },
  {
    name: 'addImageToGallery',
    description: 'הוספת תמונה לגלריה',
    parameters: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', description: 'קישור לתמונה' }
      },
      required: ['imageUrl']
    }
  },
  {
    name: 'lockBitPayment',
    description: 'נעילת תשלום ביט',
    parameters: { type: 'object', properties: {}, required: [] }
  }
  // אפשר להוסיף עוד פונקציות לפי הצורך
];

// סימולציה של ביצוע פונקציות (בפועל תוכל לחבר ל-Firebase או DB)
async function executeFunction(name, args) {
  switch (name) {
    case 'changeProductPrice':
      return `המחיר של המוצר "${args.productName}" עודכן ל־${args.newPrice} ש"ח.`;
    case 'activateEmergencyMode':
      return `מצב חירום הופעל עם ההודעה: "${args.message}".`;
    case 'addImageToGallery':
      return `התמונה "${args.imageUrl}" נוספה לגלריה.`;
    case 'lockBitPayment':
      return 'תשלום ביט ננעל באתר.';
    default:
      return 'הפעולה בוצעה.';
  }
}

app.post('/chat', async (req, res) => {
  console.log('POST /chat', req.body);
  if (!req.body || !req.body.message) {
    console.error('Missing body or message:', req.body);
    return res.status(400).json({ error: 'Missing message' });
  }
  const userMessage = req.body.message;

  try {
    console.log('Calling OpenAI...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'אתה בוט ניהול חכם של מערכת מסעדה. ענה תמיד בעברית, בלשון זכר, ובצורה עניינית. אם יש צורך בפעולה, השתמש בפונקציות.' },
        { role: 'user', content: userMessage }
      ],
      functions,
      function_call: 'auto',
      temperature: 0.3
    });
    console.log('OpenAI response:', completion);

    const response = completion.choices[0].message;
    if (response.function_call) {
      const { name, arguments: argsStr } = response.function_call;
      let args = {};
      try { args = JSON.parse(argsStr); } catch (e) { console.error('Failed to parse function args:', argsStr); }
      const result = await executeFunction(name, args);
      return res.json({ reply: result, function: name, args });
    } else {
      return res.json({ reply: response.content });
    }
  } catch (err) {
    console.error('Error in /chat:', err);
    return res.status(500).json({ error: 'שגיאה בשרת', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
}); 
