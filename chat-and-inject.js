require('dotenv').config();
const readline = require('readline');
const { exec } = require('child_process');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const ask = question => new Promise(resolve => rl.question(question, resolve));

// Logging setup
const logDir = './logs';
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const logFile = path.join(logDir, `log_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });
console.log(`[📝] Logging to ${logFile}`);
const log = (text) => {
	const timestamp = new Date().toISOString();
	logStream.write(`[${timestamp}] ${text}\n`);
};

const SYSTEM_PROMPT = `You are generating PHP layout configuration files for the Cliendo platform. The output must be a single valid PHP file. Do not include Markdown, comments, explanation, or partial fragments.

The file must define a single variable like:

<?php
$tabX = [
  'name' => '...',
  'localName' => '...',
  'forms' => [
    [
      'name' => '...',
      'localName' => '...',
      'type' => 'left' | 'right' | 'left full' | 'right full' | 'left full matrixWithComments',
      'css2' => '...', // optional
      'fields' => [ ... ],
      'choices' => [ ... ] // optional, only for matrix-style forms
    ]
  ]
];
?>

Always close the file with ?>. Return nothing except valid PHP code.

Field objects must include:
- 'name': internal key (snake_case only)
- 'localName': user-visible label. You should use HTML inline formatting tags here instead of in css2 when making field titles bold, italic or underscored or to add <br>, <ul> or <li> in case of long texts or lists when using template plainTitle.
- 'template': one of the supported types below

Optional field keys:
- 'choices': required for radio, radio2, checkbox, checkbox2, select, select2
- 'placeholder': optional string
- 'visible': conditional display based on another field (e.g. 'field_x#yes' or 'field_x#any')
- 'css2': controls styling or input behavior (e.g. 'date', 'mapPostalCode', 'intlTel')
- 'info': optional HTML string shown as a tooltip
- 'required': true to enforce mandatory input (fields are not required by default)
- 'localSubName': optional subtitle for matrix rows

Only use templates from this list:
- input, input2, input3, input4, input-readonly
- textarea, textarea2
- plainTitle
- radio, radio2
- checkbox, checkbox2
- select, select2
- map
- file, files, files2
- signature, signature2
- matrixHeader, matrixRadio
- repeat

If the user requests something unsupported, you MUST map it to the most similar valid template above.

Repeat field rules:
- Every repeat block MUST include a field with 'name' => 'label', 'template' => 'input'
- May include 'list' or 'addWord'
- Repeat items must be inside 'fields'

Correct repeat example:
[
  'name' => 'contacts',
  'template' => 'repeat',
  'addWord' => 'contactpersoon',
  'fields' => [
    ['name' => 'label', 'localName' => 'Naam', 'template' => 'input'],
    ['name' => 'email', 'localName' => 'E-mailadres', 'template' => 'input']
  ]
]

Matrix layout rules:
- Form must include 'choices' at the same level as 'fields'
- Use one 'matrixHeader' followed by one or more 'matrixRadio' fields
- NEVER include nested 'fields' inside matrixHeader

Correct matrix example:
[
  'name' => 'risc_matrix',
  'localName' => 'RISC',
  'type' => 'left full matrixWithComments',
  'choices' => [
    ['value' => 'A', 'label' => 'Geen moeite'],
    ['value' => 'B', 'label' => 'Enige moeite'],
    ['value' => 'C', 'label' => 'Veel moeite']
  ],
  'fields' => [
    ['name' => 'matrix1', 'localName' => 'Aankleden', 'template' => 'matrixHeader', 'localSubName' => 'Kon u...'],
    ['name' => 'matrix2', 'localName' => 'Uw haar wassen?', 'template' => 'matrixRadio'],
    ['name' => 'matrix3', 'localName' => 'Zelf eten bereiden?', 'template' => 'matrixRadio']
  ]
]

Common mistakes to avoid:
- Do not forget the 'label' field in any repeat block
- Do not place fields inside matrixHeader
- Do not forget to include 'null' as the first choice in select/select2. This first choice should have an empty label.
- Do not use capital letters or spaces in any 'name' keys
- Never make a field required unless explicitly told

You must ALWAYS return a complete, valid PHP file. No markdown, no explanations.`;


let currentLayout = '';

async function main() {
    log('=== Script started ===');
	console.log('👑 Welcome to Cliendo ChatGPT Layout Assistant');

	while (true) {
		const input = await ask('\n🗣️  What layout do you want? (or type "Ctrl + c (twice))")\n> ');
		if (input.toLowerCase() === 'exit') break;

		const messages = [
			{ role: 'system', content: SYSTEM_PROMPT }
		];

		if (currentLayout.trim()) {
			messages.push({
				role: 'user',
				content: `Here is the current PHP layout:\n\n${currentLayout}`
			});
		}

		messages.push({ role: 'user', content: input });
		log(`User input: ${input}`);
		log(`Messages sent to model:\n${JSON.stringify(messages, null, 2)}`);

		console.log('\n💬 Talking to GPT...');
		const start = Date.now();
		const response = await openai.chat.completions.create({
			model: 'gpt-4',
			messages,
			temperature: 0.3
		});
		const end = Date.now();

		const assistantReply = response.choices[0].message.content.trim();
		currentLayout = assistantReply;
		log(`Response from model (in ${end - start}ms):\n${assistantReply}`);

		const encodedPhp = encodeURIComponent(assistantReply);
		console.log('\n🚀 Running injection script...\n');

		try {
            const inject = require('./inject-code.js');
            await inject.main(encodedPhp);
        } catch (err) {
            console.error('❌ Injection failed:', err.message);
            log(`ERROR during injection: ${err.message}`);
        }

	}

	rl.close();
	logStream.end();
}

if (require.main === module) {
  main();
}

module.exports = { main };

