import { google } from "@ai-sdk/google"
import { streamText } from "ai"
import { config } from "../../config/google.config.js"
import chalk from chalk

export class AIService{
    constructor(){
        if(!config.googleApiKey){
            console.log("Google api key is not configured");
        }
        this.model = google(config.model , {
            apiKey: config.googleApiKey,
        }
        )
    }

    /**
     * send msg and get streaming response
     * @param {Array} messages
     * @param {Function} onChunk
     * @param {object} tools
     * @param {Function} onToolCall
     * @return {Promise<object>}
     * 
     */

    async sendMessage(messages, tools = undefined, onChunk, onToolCall = null){
        try {
            streamConfig = {
                model: config.model,
                messages: messages,
                
            }
            
            const result = streamText(streamConfig);
            const fullResponce = "";
            for await (const chunk of result.textStream){
                fullResponce += chunk;
                if(onChunk){
                    onChunk(chunk);
                } 
            }
            const fullResult = result;

            return{
                content:fullResponce,
                finishResponce:fullResult.finishReason,
                usage:fullResult.usage
            }


        } catch (error) {
            console.error(chalk.red("AI service error "), error.message);
            throw error;
        }
    }

    /**
     * get a non streaming response
     * @param {Array} messages - array of message objects
     * @param {Object} tools - Optional tools
     * @return {Promise<string>} Response text
     */

    async getMessage (messages , tools=undefined) {
        let fullResponce = "";
        await this.sendMessage(messages , (chunk)=>{
            fullResponce += chunk
        })
        return fullResponce
    }
}