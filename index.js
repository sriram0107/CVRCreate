
const express = require("express");
const cors = require("cors");
require('dotenv').config();
require('express-zip');

const bodyParser = require("body-parser");
const app = express();

const _ = require('lodash');

const docx = require("docx");

const OpenAI = require('openai');
const openai = new OpenAI();

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(express.static("frontend"));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get("/", (req, res) => {
  res.render("index");
});

app.post('/submit', async (req, res) => {
    const header = req.body.header
    const prompt = req.body.prompt
    const footer = req.body.footer
    let files = []
    for (const key of _.keys(prompt)) {
        const value = prompt[key]
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: `Generate a cover letter for ${key}. Use this information - ${value}`
                }
            ],
            model: 'gpt-3.5-turbo',
        });
        
        const aiGeneratedCoverLetter = completion.choices[0].message.content
        const doc = new docx.Document({
            sections: [
                {
                    properties: {},
                    children: [
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun(header + '\n\n'),
                                new docx.TextRun(aiGeneratedCoverLetter + '\n\n'),
                                new docx.TextRun(footer),
                            ],
                        }),
                    ],
                },
            ],
        });
        const buffer = await docx.Packer.toBuffer(doc)
        files.push({ name: `${key}-cover-letter.docx`, buffer: buffer, path: '' })
    }
    // Render Docs
    res.zip(files, 'cover-letter.zip')
    return
});

app.listen(3000, () => console.log("Server running on port 3000"));