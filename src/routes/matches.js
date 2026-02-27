import { db } from '../db/db.js';
import {Router} from 'express'
import {createMatchSchema, listMatchesQuerySchema} from '../validation/matches.js'
import { matches } from '../db/schema.js';
import { getMatchStatus } from '../utils/match-status.js';
import { desc } from "drizzle-orm";

export const matchRouter=Router();

matchRouter.post('/',async(req,res)=>{
  
    const parsed = createMatchSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: 'Invalid payload', details:JSON.stringify(parsed.error)})
    }

    const {data:{startTime,endTime, homeScore,awayScore}}=parsed

    try{
        //const event = result[0];
        console.log('here in try')
        const [event]= await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            status: getMatchStatus(startTime,endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0

        }).returning()

        if (req.app.locals.broadcastMatchCreated) {
            req.app.locals.broadcastMatchCreated(event);
        }
        res.status(201).json({data:event})
    }
    catch(e){
        res.status(500).json({error:"Match could not be created"})
    }
})
matchRouter.get('/',async(req,res)=>{
    const parsed=listMatchesQuerySchema.safeParse(req.query)
    if (!parsed.success) {
        return res.status(400).json({error: 'Invalid query', details:JSON.stringify(parsed.error)})
    }

    const limit=parsed.data.limit ?? 50;
    try{
        const data=await db
                            .select()
                            .from(matches)
                            .orderBy(desc(matches.createdAt))
                            .limit(limit);

        return res.status(200).json(data)

    }
    catch(e){
        res.status(500).json({error:"MatchList could not be fetched"})
    }
 
})
