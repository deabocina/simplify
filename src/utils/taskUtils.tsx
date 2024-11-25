import confetti from "canvas-confetti";

export const noTasksMessages = [
  "Task-free zone! Is this intentional, or are you living the dream?",
  "So empty, so zen. Are you secretly a productivity guru?",
  "Task list is clear! Off to adventure, or time to make some new plans?",
  "No tasks in sight! Are you on a secret mission?",
  "Congratulations! You’ve reached peak relaxation with no tasks in sight!",
  "No tasks found! Did you solve the mystery of productivity?",
  "No tasks here! Maybe it's your lucky day?",
  "Looks like someone has mastered the art of doing nothing.",
  "Is this a vacation, or are you just too efficient for tasks?",
  "No tasks, no stress. Just pure bliss, huh?",
  "Is it even possible to be this organised? No tasks at all!",
  "Clear of tasks! Is today a day for self-care or new ideas?",
  "You’ve unlocked a rare achievement: A task-free day!",
  "You’re officially on a task-free streak. Let’s keep it going!",
  "You’ve earned a task-free moment. Time to relax and recharge!",
];

export const launchConfetti = () => {
  confetti({
    particleCount: 200,
    spread: 200,
    origin: { y: 0.6 },
  });
};
