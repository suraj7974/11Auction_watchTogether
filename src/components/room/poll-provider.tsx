"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRoom } from "@/components/room/room-provider";

export type Poll = { id: string; question: string; options: string[]; closed: boolean };

type PollContextValue = {
  poll: Poll | null;
  counts: number[];
  totalVotes: number;
  myVote: number | null;
  canManage: boolean;
  createPoll: (question: string, options: string[]) => void;
  vote: (optionIndex: number) => void;
  closePoll: () => void;
};

const PollContext = createContext<PollContextValue | null>(null);

export function usePoll() {
  const ctx = useContext(PollContext);
  if (!ctx) throw new Error("usePoll must be used within a PollProvider");
  return ctx;
}

/** Ephemeral polls broadcast over the room channel (not persisted). */
export function PollProvider({ children }: { children: React.ReactNode }) {
  const { broadcast, onBroadcast, currentUser, isHost, connection } = useRoom();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [votesByUser, setVotesByUser] = useState<Record<string, number>>({});

  const pollRef = useRef(poll);
  const votesRef = useRef(votesByUser);
  useEffect(() => {
    pollRef.current = poll;
    votesRef.current = votesByUser;
  });

  // Realtime handlers (registered once; read live state from refs).
  useEffect(() => {
    const offs = [
      onBroadcast("poll_new", (p) => {
        setPoll(p as Poll);
        setVotesByUser({});
      }),
      onBroadcast("poll_vote", (p) => {
        const { pollId, userId, option } = p as { pollId: string; userId: string; option: number };
        if (pollRef.current?.id === pollId) {
          setVotesByUser((prev) => ({ ...prev, [userId]: option }));
        }
      }),
      onBroadcast("poll_close", (p) => {
        const { pollId } = p as { pollId: string };
        setPoll((cur) => (cur && cur.id === pollId ? { ...cur, closed: true } : cur));
      }),
      onBroadcast("poll_req", () => {
        // Host answers late joiners with the active poll + current votes.
        if (isHost && pollRef.current) {
          broadcast("poll_state", { poll: pollRef.current, votesByUser: votesRef.current });
        }
      }),
      onBroadcast("poll_state", (p) => {
        if (isHost) return;
        const data = p as { poll: Poll | null; votesByUser: Record<string, number> };
        setPoll(data.poll ?? null);
        setVotesByUser(data.votesByUser ?? {});
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [onBroadcast, broadcast, isHost]);

  // Late joiner (and on reconnect): ask the host for any active poll.
  useEffect(() => {
    if (!isHost && connection === "live") broadcast("poll_req", {});
  }, [isHost, connection, broadcast]);

  const createPoll = useCallback(
    (question: string, options: string[]) => {
      if (!isHost) return;
      const next: Poll = { id: crypto.randomUUID(), question, options, closed: false };
      setPoll(next);
      setVotesByUser({});
      broadcast("poll_new", next);
    },
    [isHost, broadcast],
  );

  const vote = useCallback(
    (optionIndex: number) => {
      const cur = pollRef.current;
      if (!cur || cur.closed) return;
      setVotesByUser((prev) => ({ ...prev, [currentUser.id]: optionIndex }));
      broadcast("poll_vote", { pollId: cur.id, userId: currentUser.id, option: optionIndex });
    },
    [broadcast, currentUser.id],
  );

  const closePoll = useCallback(() => {
    const cur = pollRef.current;
    if (!isHost || !cur) return;
    setPoll({ ...cur, closed: true });
    broadcast("poll_close", { pollId: cur.id });
  }, [isHost, broadcast]);

  const counts = poll
    ? poll.options.map((_, i) => Object.values(votesByUser).filter((v) => v === i).length)
    : [];
  const totalVotes = Object.keys(votesByUser).length;
  const myVote = votesByUser[currentUser.id] ?? null;

  const value: PollContextValue = {
    poll,
    counts,
    totalVotes,
    myVote,
    canManage: isHost,
    createPoll,
    vote,
    closePoll,
  };

  return <PollContext.Provider value={value}>{children}</PollContext.Provider>;
}
