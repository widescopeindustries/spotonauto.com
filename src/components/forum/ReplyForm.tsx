'use client';

interface ReplyFormProps {
  threadId: string;
}

export default function ReplyForm() {
  return (
    <div className="glass p-6 rounded-xl text-center text-gray-400">
      Reply posting requires sign-in and moderator review while migration hardening is in progress.
    </div>
  );
}
