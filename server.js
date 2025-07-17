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
  apiKey: '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',
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
  console.log('POST /chat', req.body); // Debug log for incoming requests
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: 'Missing message' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [
        { role: 'system', content: 'אתה בוט ניהול חכם של מערכת מסעדה. ענה תמיד בעברית, בלשון זכר, ובצורה עניינית. אם יש צורך בפעולה, השתמש בפונקציות.' },
        { role: 'user', content: userMessage }
      ],
      functions,
      function_call: 'auto',
      temperature: 0.3
    });

    const response = completion.choices[0].message;
    if (response.function_call) {
      // הבוט ביקש להפעיל פונקציה
      const { name, arguments: argsStr } = response.function_call;
      let args = {};
      try { args = JSON.parse(argsStr); } catch (e) {}
      const result = await executeFunction(name, args);
      return res.json({ reply: result, function: name, args });
    } else {
      // תשובה רגילה
      return res.json({ reply: response.content });
    }
  } catch (err) {
    return res.status(500).json({ error: 'שגיאה בשרת', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
}); 
