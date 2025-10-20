require('dotenv').config();
const fs = require('fs');
const { exec } = require('child_process');
const readline = require('readline');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUTPUT_FILE = 'inject-code.js';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const ask = question => new Promise(resolve => rl.question(question, resolve));

// 🧠 Example-enriched system prompt (basic structure)
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
- 'localName': user-visible label
- 'template': one of the supported types below

Optional field keys:
- 'choices': required for radio, radio2, checkbox, checkbox2, select, select2
- 'placeholder': optional string
- 'visible': conditional display based on another field (e.g. 'fieldX#yes' or 'fieldX#any')
- 'css2': controls styling or input behavior (e.g. 'date', 'mapPostalCode', 'intlTel')
- 'info': optional HTML string shown as a tooltip
- 'required': true to enforce mandatory input
- 'localSubName': optional subtitle for matrix rows

Supported templates:
- input, input2, input3, input4, input-readonly
- textarea, textarea2
- plainTitle
- radio, radio2
- checkbox, checkbox2
- select, select2 (MUST begin with a null choice: ['value' => 'null', 'label' => ''])
- boolean, switch
- map
- file, files, files2
- signature, signature2
- matrixHeader, matrixRadio
- repeat

Repeat fields:
- Every repeat block MUST include a field with 'name' => 'label', 'template' => 'input'
- Optionally include 'list' or 'addWord'
- Repeat items must be inside 'fields'

Correct example:
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
- NEVER include nested 'fields' inside 'matrixHeader'

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

Forbidden templates:
- NEVER use: radio3, options

Common mistakes to avoid:
- Do not forget the 'label' field in any repeat block
- Do not place fields inside matrixHeader
- Do not forget to include 'null' as the first choice in select/select2
- Do not use capital letters or spaces in any 'name' keys

You must ALWAYS return a complete, valid PHP file. No markdown, no explanations.`;




const messages = [
	{ role: 'system', content: SYSTEM_PROMPT }
];

async function main() {
	console.log('👑 Welcome to Cliendo ChatGPT Layout Assistant');

	while (true) {
		const input = await ask('\n🗣️  What layout do you want? (or type "exit")\n> ');
		if (input.toLowerCase() === 'exit') break;

		messages.push({ role: 'user', content: input });

		console.log('\n💬 Talking to GPT...');
		const response = await openai.chat.completions.create({
			model: 'gpt-4',
			messages,
			temperature: 0.3
		});

		const assistantReply = response.choices[0].message.content.trim();
		messages.push({ role: 'assistant', content: assistantReply });

		// Update PHP inside inject-code.js
		let injectScript = fs.readFileSync(OUTPUT_FILE, 'utf-8');
		injectScript = injectScript.replace(
			/const phpCode = `[^`]*`;/s,
			`const phpCode = \`${assistantReply}\`;`
		);
		fs.writeFileSync(OUTPUT_FILE, injectScript);
		console.log('✅ PHP code injected into inject-code.js');

		// Run injection
		console.log('\n🚀 Running injection script...\n');
		exec('node inject-code.js', (err, stdout, stderr) => {
			if (err) console.error(err);
			if (stdout) console.log(stdout);
			if (stderr) console.error(stderr);
		});
	}

	rl.close();
}

main();
