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
}
]