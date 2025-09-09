import { tool } from '@openai/agents/realtime';
import { RealtimeItem } from '@openai/agents/realtime';
import { supervisorAgentInstructions, supervisorAgentTools, executeToolLocally } from './supervisorAgent';

// Helper function to call the /api/responses endpoint
async function fetchResponsesMessage(body: any) {
  const response = await fetch('/api/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Preserve the previous behaviour of forcing sequential tool calls
    body: JSON.stringify({ ...body, parallel_tool_calls: false }),
  });

  if (!response.ok) {
    console.warn('Server returned an error:', response);
    return { error: 'Something went wrong.' };
  }

  const completion = await response.json();
  return completion;
}

// Handle iterative tool calls from supervisor
async function handleToolCalls(
  body: any,
  response: any,
  addBreadcrumb?: (title: string, data?: any) => void,
) {
  let currentResponse = response;

  while (true) {
    if (currentResponse?.error) {
      return { error: 'Something went wrong.' } as any;
    }

    const outputItems: any[] = currentResponse.output ?? [];
    
    // Gather all function calls in the output
    const functionCalls = outputItems.filter((item) => item.type === 'function_call');

    if (functionCalls.length === 0) {
      // No more function calls – build and return the assistant's final message
      const assistantMessages = outputItems.filter((item) => item.type === 'message');

      const finalText = assistantMessages
        .map((msg: any) => {
          const contentArr = msg.content ?? [];
          return contentArr
            .filter((c: any) => c.type === 'output_text')
            .map((c: any) => c.text)
            .join('');
        })
        .join('\n');

      return finalText;
    }

    // For each function call returned by the supervisor model, execute it locally
    for (const toolCall of functionCalls) {
      const fName = toolCall.name;
      const args = JSON.parse(toolCall.arguments || '{}');
      
      // Execute dashboard tool locally
      const toolRes = await executeToolLocally(fName, args);
      
      // Log breadcrumbs for debugging
      if (addBreadcrumb) {
        addBreadcrumb(`[supervisor] function call: ${fName}`, args);
      }
      if (addBreadcrumb) {
        addBreadcrumb(`[supervisor] function result: ${fName}`, toolRes);
      }

      // Add function call and result to the request body to send back to responses API
      body.input.push(
        {
          type: 'function_call',
          call_id: toolCall.call_id,
          name: toolCall.name,
          arguments: toolCall.arguments,
        },
        {
          type: 'function_call_output',
          call_id: toolCall.call_id,
          output: JSON.stringify(toolRes),
        },
      );
    }

    // Make the follow-up request including the tool outputs
    currentResponse = await fetchResponsesMessage(body);
  }
}

export const getNextResponseFromSupervisor = tool({
  name: 'getNextResponseFromSupervisor',
  description: 'Get guidance from the supervisor agent for dashboard operations. Use this for ALL dashboard-related requests.',
  parameters: {
    type: 'object',
    properties: {
      relevantContextFromLastUserMessage: {
        type: 'string',
        description: 'Key context from the most recent user message that the supervisor needs to know. Keep it concise.',
      },
    },
    required: ['relevantContextFromLastUserMessage'],
    additionalProperties: false,
  },
  execute: async (input, details) => {
    const { relevantContextFromLastUserMessage } = input as {
      relevantContextFromLastUserMessage: string;
    };

    // Get breadcrumb function if available
    const addBreadcrumb = (details?.context as any)?.addTranscriptBreadcrumb as
      | ((title: string, data?: any) => void)
      | undefined;

    // Get conversation history from context
    const history: RealtimeItem[] = (details?.context as any)?.history ?? [];
    const filteredLogs = history.filter((log) => log.type === 'message');

    // Build request body for Responses API
    const body: any = {
      model: 'gpt-4o',  // Changed from gpt-4.1 to gpt-4o for faster responses
      input: [
        {
          type: 'message',
          role: 'system',
          content: supervisorAgentInstructions,
        },
        {
          type: 'message',
          role: 'user',
          content: `==== Conversation History ====
${JSON.stringify(filteredLogs, null, 2)}

==== Relevant Context From Last User Message ====
${relevantContextFromLastUserMessage}

==== Instructions ====
Based on the conversation history and the recent context, determine what dashboard operation the user wants and execute it using the available tools. Then provide a clear, concise response that the junior agent can relay to the user.`,
        },
      ],
      tools: supervisorAgentTools,
    };

    try {
      // Make initial request to supervisor
      const response = await fetchResponsesMessage(body);
      
      if (response.error) {
        console.error('Supervisor API error:', response.error);
        return "I'm having trouble accessing the dashboard controls right now. Could you try that again?";
      }

      // Handle any tool calls iteratively until we get a final response
      const finalText = await handleToolCalls(body, response, addBreadcrumb);
      
      if ((finalText as any)?.error) {
        console.error('Tool execution error:', finalText);
        return "There was an issue executing that operation. Please try again.";
      }

      // Return the supervisor's response for the junior agent to read
      return finalText as string;
      
    } catch (error: any) {
      console.error('Supervisor consultation failed:', error);
      return "I'm having trouble with that operation right now. Could you try again?";
    }
  },
});