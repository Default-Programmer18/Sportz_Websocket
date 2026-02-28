import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";
const arcjetKey= process.env.ARCJET_KEY
const arcjetMode= process.env.ARCJET_MODE === 'DRY_RUN'? 'DRY_RUN' :'LIVE'

// const logger = {
//   debug: console.log,
//   info: console.log,
//   warn: console.warn,
//   error: console.error,
// }
//const client = createRemoteClient({})

if(!arcjetKey)
    throw new Error( "Arcjet Key not available.")

export const httpArcjet=arcjetKey?
                            arcjet({
                                key:arcjetKey,
                                rules: [
                                    // Shield protects your app from common attacks e.g. SQL injection
                                    shield({ mode: arcjetMode }),
                                    detectBot({
                                        mode: arcjetMode ,
                                        allow:[
                                            "CATEGORY:SEARCH_ENGINE",
                                            "CATEGORY:PREVIEW",
                                        ]
                                    }),
                                    slidingWindow({ 
                                        mode: arcjetMode ,
                                        interval: '10s', // 60 second sliding window
                                        max: 40
                                    })
                                ],
                                
                            }):null
export const wsArcjet=arcjetKey?
                            arcjet({
                                key:arcjetKey,
                                rules: [
                                    // Shield protects your app from common attacks e.g. SQL injection
                                    shield({ mode: arcjetMode }),
                                    
                                    detectBot({
                                        mode: arcjetMode ,
                                        allow:[
                                            "CATEGORY:SEARCH_ENGINE",
                                            "CATEGORY:PREVIEW",
                                        ]
                                    }),
                                    slidingWindow({ 
                                        mode: arcjetMode ,
                                        interval: '2s', // 60 second sliding window
                                        max: 5
                                    })
                                ],
                                
                            }):null

export function securityMiddleware(){
    return async(req,res,next)=>{
        if(!httpArcjet)
            return next();
        try{
            const decision = await httpArcjet.protect(req);
            console.log("Arcjet decision", decision);
            
            if(decision.isDenied){

                if (decision.reason.isRateLimit()) {
                    return res.status(429).json({ error: "Too Many Requests" });
                } 
                else if (decision.reason.isBot()) {
                    return res.status(403).json({ error: "No bots allowed"});
                } 
                else {
                    return res.status(403).json({ error: "Forbidden"});
                }
            }
        }
        catch(e){
            console.log('Security Error from  securityMiddleware',e)
            res.status(503).json({error: 'Service Unavailable'})
            return ;
        }
        next();
    }
}