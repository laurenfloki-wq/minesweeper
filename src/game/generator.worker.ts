/// <reference lib="webworker" />
import { generateNoGuess, generateDaily } from './generator';
import { difficultyById } from './difficulties';

type Req =
  | { type: 'noguess'; reqId: number; difficultyId: string }
  | { type: 'daily'; reqId: number; difficultyId: string; dateKey: string };

self.onmessage = (e: MessageEvent<Req>) => {
  const msg = e.data;
  const d = difficultyById(msg.difficultyId);
  let board = null;
  if (msg.type === 'noguess') board = generateNoGuess(d);
  else if (msg.type === 'daily') board = generateDaily(d, msg.dateKey);
  (self as unknown as Worker).postMessage({ type: 'board', reqId: msg.reqId, board });
};
