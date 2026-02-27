import {MATCH_STATUS} from '../validation/matches.js'

export const getMatchStatus=(startTime,endTime,now=new Date())=>{
    const start=new Date(startTime)
    const end=new Date(endTime)

    if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime()))  
        return null;
    else if(now<start)
        return MATCH_STATUS.scheduled;
    else if(now>=end)
        return MATCH_STATUS.finished;
    else
        return MATCH_STATUS.live;
}