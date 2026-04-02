import { google } from "@ai-sdk/google";
import chalk from "chalk"
export const availableTools = [
{
    id:"google_search",
    name:"Google Search",
    description:"Access the latest information usign Google search, useful for current events",
    getTool:()=>{
        google.tools.googleSearch({})
    },
    enabled: false,
},
 {
    id: 'code_execution',
    name: 'Code Execution',
    description: 'Generate and execute Python code to perform calculations, solve problems, or provide accurate information.',
    getTool: () => google.tools.codeExecution({}),
    enabled: false,
  },
    {
    id: 'url_context',
    name: 'URL Context',
    description: 'Provide specific URLs that you want the model to analyze directly from the prompt. Supports up to 20 URLs per request.',
    getTool: () => google.tools.urlContext({}),
    enabled: false,
  },
]