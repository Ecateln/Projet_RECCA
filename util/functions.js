import { ollama } from './globals.js';

async function* askAgent(prompt, previous_messages, think = false, web = false) {
    // TODO: web requests
    // TODO: if no previous messages, append base prompt to the current prompt

    const question = { date: Date.now(), role: 'user', content: prompt };
    const response = await ollama.chat({
        model: 'qwen3:4b',
        messages: previous_messages.concat(question),
        stream: true,
        think,
    });

    // let startedThinking = false;
    // let finishedThinking = false;

    let full_response = '';
    for await (const chunk of response) {
        // if (chunk.message.thinking && !startedThinking) {
        //     startedThinking = true;
        //     process.stdout.write('Thinking:\n========\n\n');
        // } else if (chunk.message.content && startedThinking && !finishedThinking) {
        //     finishedThinking = true;
        //     process.stdout.write('\n\nResponse:\n========\n\n');
        // }

        if (chunk.message.thinking) {
            // process.stdout.write(chunk.message.thinking);
        } else if (chunk.message.content) {
            yield chunk.message.content;
            full_response += chunk.message.content;
            // process.stdout.write(chunk.message.content);
        }
    }

    previous_messages.push(question, { date: Date.now(), role: 'assistant', content: full_response });
}

export { askAgent }