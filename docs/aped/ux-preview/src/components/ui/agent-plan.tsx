import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDotDashed,
  CircleX,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

interface Subtask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tools?: string[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  level: number;
  dependencies: string[];
  subtasks: Subtask[];
}

const cloudVaultTasks: Task[] = [
  {
    id: "1",
    title: "Upload & Encrypt Files",
    description: "Secure file upload pipeline with AES-256 encryption",
    status: "completed",
    priority: "high",
    level: 0,
    dependencies: [],
    subtasks: [
      { id: "1.1", title: "Pre-signed URL generation", description: "Generate temporary S3 upload URLs scoped per user", status: "completed", priority: "high", tools: ["aws-s3", "auth-service"] },
      { id: "1.2", title: "Direct browser-to-S3 upload", description: "Upload files directly without server transit", status: "completed", priority: "high", tools: ["s3-client", "browser-api"] },
      { id: "1.3", title: "Server-side encryption", description: "AES-256 encryption at rest on all stored files", status: "completed", priority: "high", tools: ["aws-kms", "s3-encryption"] },
    ],
  },
  {
    id: "2",
    title: "Thumbnail Generation",
    description: "Automatic preview generation for uploaded images",
    status: "in-progress",
    priority: "high",
    level: 0,
    dependencies: [],
    subtasks: [
      { id: "2.1", title: "S3 event trigger", description: "Detect new image uploads via ObjectCreated events", status: "completed", priority: "high", tools: ["aws-eventbridge", "s3-notifications"] },
      { id: "2.2", title: "Lambda processing", description: "Generate 200x200 thumbnails using image processing", status: "in-progress", priority: "high", tools: ["aws-lambda", "sharp-js"] },
      { id: "2.3", title: "Metadata association", description: "Link thumbnail URLs back to file records", status: "pending", priority: "medium", tools: ["prisma-orm", "postgresql"] },
    ],
  },
  {
    id: "3",
    title: "GDPR Compliance",
    description: "EU data residency and privacy compliance",
    status: "in-progress",
    priority: "high",
    level: 0,
    dependencies: [],
    subtasks: [
      { id: "3.1", title: "EU data residency", description: "All data stored in AWS eu-west-3 (Paris)", status: "completed", priority: "high", tools: ["aws-config", "compliance-audit"] },
      { id: "3.2", title: "Right to erasure", description: "Complete data deletion from S3 and database", status: "in-progress", priority: "high", tools: ["s3-lifecycle", "prisma-orm"] },
      { id: "3.3", title: "Audit logging", description: "Track all file access and modifications", status: "pending", priority: "medium", tools: ["cloudwatch", "audit-trail"] },
    ],
  },
  {
    id: "4",
    title: "CI/CD Pipeline",
    description: "Automated build, test, and deploy workflow",
    status: "pending",
    priority: "medium",
    level: 1,
    dependencies: ["1", "2"],
    subtasks: [
      { id: "4.1", title: "GitHub Actions CI", description: "Lint, type-check, test on every push", status: "pending", priority: "high", tools: ["github-actions", "turborepo"] },
      { id: "4.2", title: "Docker deployment", description: "Containerized deploy to EC2 via SSH", status: "pending", priority: "medium", tools: ["docker", "ec2-deploy"] },
      { id: "4.3", title: "Health monitoring", description: "Endpoint checks for DB and S3 connectivity", status: "pending", priority: "medium", tools: ["cloudwatch", "healthcheck"] },
    ],
  },
];

export default function AgentPlan() {
  const [tasks, setTasks] = useState<Task[]>(cloudVaultTasks);
  const [expandedTasks, setExpandedTasks] = useState<string[]>(["1"]);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});

  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSubtaskExpansion = (taskId: string, subtaskId: string) => {
    const key = `${taskId}-${subtaskId}`;
    setExpandedSubtasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSubtaskStatus = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map((subtask) =>
            subtask.id === subtaskId
              ? { ...subtask, status: subtask.status === "completed" ? "pending" : "completed" }
              : subtask
          );
          const allDone = updatedSubtasks.every((s) => s.status === "completed");
          return { ...task, subtasks: updatedSubtasks, status: allDone ? "completed" : task.status };
        }
        return task;
      })
    );
  };

  const taskVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : -5 },
    visible: { opacity: 1, y: 0, transition: { type: (prefersReducedMotion ? "tween" : "spring") as "tween" | "spring", stiffness: 500, damping: 30 } },
  };

  const subtaskListVariants = {
    hidden: { opacity: 0, height: 0, overflow: "hidden" as const },
    visible: { height: "auto", opacity: 1, overflow: "visible" as const, transition: { duration: 0.25, staggerChildren: 0.05, when: "beforeChildren" as const, ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number] } },
    exit: { height: 0, opacity: 0, overflow: "hidden" as const, transition: { duration: 0.2 } },
  };

  const subtaskVariants = {
    hidden: { opacity: 0, x: prefersReducedMotion ? 0 : -10 },
    visible: { opacity: 1, x: 0, transition: { type: (prefersReducedMotion ? "tween" : "spring") as "tween" | "spring", stiffness: 500, damping: 25 } },
  };

  const StatusIcon = ({ status, size = "h-4 w-4" }: { status: string; size?: string }) => {
    switch (status) {
      case "completed": return <CheckCircle2 className={`${size} text-emerald-500`} />;
      case "in-progress": return <CircleDotDashed className={`${size} text-blue-500`} />;
      case "need-help": return <CircleAlert className={`${size} text-yellow-500`} />;
      case "failed": return <CircleX className={`${size} text-red-500`} />;
      default: return <Circle className={`${size} text-[var(--muted-foreground)]`} />;
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-emerald-500/10 text-emerald-500";
      case "in-progress": return "bg-blue-500/10 text-blue-500";
      case "need-help": return "bg-yellow-500/10 text-yellow-500";
      case "failed": return "bg-red-500/10 text-red-500";
      default: return "bg-[var(--muted)] text-[var(--muted-foreground)]";
    }
  };

  return (
    <div className="text-[var(--foreground)] overflow-auto">
      <motion.div
        className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0.65, 0.3, 0.9] } }}
      >
        <LayoutGroup>
          <div className="p-4 overflow-hidden">
            <ul className="space-y-1">
              {tasks.map((task, index) => {
                const isExpanded = expandedTasks.includes(task.id);
                const isCompleted = task.status === "completed";
                return (
                  <motion.li key={task.id} className={index !== 0 ? "mt-1 pt-2" : ""} initial="hidden" animate="visible" variants={taskVariants}>
                    <div className="group flex items-center px-3 py-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors cursor-pointer" onClick={() => toggleTaskExpansion(task.id)}>
                      <div className="mr-2 flex-shrink-0">
                        <StatusIcon status={task.status} size="h-4.5 w-4.5" />
                      </div>
                      <div className="flex min-w-0 flex-grow items-center justify-between">
                        <span className={`text-sm ${isCompleted ? "text-[var(--muted-foreground)] line-through" : ""}`}>{task.title}</span>
                        <div className="flex items-center gap-2 ml-2">
                          {task.dependencies.length > 0 && task.dependencies.map((dep, idx) => (
                            <span key={idx} className="bg-[var(--secondary)] rounded px-1.5 py-0.5 text-[10px] font-medium">{dep}</span>
                          ))}
                          <span className={`rounded px-1.5 py-0.5 text-xs ${statusColor(task.status)}`}>{task.status}</span>
                        </div>
                      </div>
                    </div>
                    <AnimatePresence mode="wait">
                      {isExpanded && task.subtasks.length > 0 && (
                        <motion.div className="relative overflow-hidden" variants={subtaskListVariants} initial="hidden" animate="visible" exit="exit" layout>
                          <div className="absolute top-0 bottom-0 left-[20px] border-l-2 border-dashed border-[var(--border)]" />
                          <ul className="mt-1 mr-2 mb-1.5 ml-3 space-y-0.5">
                            {task.subtasks.map((subtask) => {
                              const subtaskKey = `${task.id}-${subtask.id}`;
                              const isSubExpanded = expandedSubtasks[subtaskKey];
                              return (
                                <motion.li key={subtask.id} className="flex flex-col py-0.5 pl-6 cursor-pointer" onClick={() => toggleSubtaskExpansion(task.id, subtask.id)} variants={subtaskVariants} layout>
                                  <div className="flex items-center rounded-md p-1 hover:bg-[var(--secondary)] transition-colors">
                                    <div className="mr-2 flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleSubtaskStatus(task.id, subtask.id); }}>
                                      <StatusIcon status={subtask.status} size="h-3.5 w-3.5" />
                                    </div>
                                    <span className={`text-sm ${subtask.status === "completed" ? "text-[var(--muted-foreground)] line-through" : ""}`}>{subtask.title}</span>
                                  </div>
                                  <AnimatePresence>
                                    {isSubExpanded && (
                                      <motion.div className="text-[var(--muted-foreground)] border-l border-dashed border-[var(--border)] mt-1 ml-1.5 pl-5 text-xs overflow-hidden" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                                        <p className="py-1">{subtask.description}</p>
                                        {subtask.tools && subtask.tools.length > 0 && (
                                          <div className="mt-0.5 mb-1 flex flex-wrap items-center gap-1.5">
                                            <span className="font-medium">Tools:</span>
                                            {subtask.tools.map((tool, idx) => (
                                              <span key={idx} className="bg-[var(--secondary)] rounded px-1.5 py-0.5 text-[10px] font-medium">{tool}</span>
                                            ))}
                                          </div>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.li>
                              );
                            })}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </LayoutGroup>
      </motion.div>
    </div>
  );
}
