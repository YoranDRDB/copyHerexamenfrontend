// src/service/_handleDBError.ts
import ServiceError from "../core/serviceError";
const handleDBError = (error: any) => {
  const code = error?.code ?? "";
  const model = error?.meta?.modelName ?? "";
  const target = error?.meta?.target ?? "";

  if (code === "P2002") {
    if (model === "User" && String(target).includes("idx_user_email_unique")) {
      throw ServiceError.validationFailed(
        "There is already a user with this email address"
      );
    }
    if (model === "TaskAssignee" && target === "PRIMARY") {
      throw ServiceError.validationFailed(
        "This user is already assigned to this task"
      );
    }
    if (model === "TaskTag" && target === "PRIMARY") {
      throw ServiceError.validationFailed(
        "This tag is already attached to this task"
      );
    }
  }

  if (code === "P2003") {
    const msg = String(error?.message ?? "");
    if (msg.includes("fk_project_owner"))
      throw ServiceError.conflict("Owner user does not exist");
    if (msg.includes("fk_task_project"))
      throw ServiceError.conflict("Project does not exist or is linked");
    if (msg.includes("fk_taskassignee_user"))
      throw ServiceError.conflict("Assigned user does not exist");
    if (msg.includes("fk_taskassignee_task"))
      throw ServiceError.conflict("Task does not exist");
    if (msg.includes("fk_tasktag_tag"))
      throw ServiceError.conflict("Tag does not exist");
    if (msg.includes("fk_tasktag_task"))
      throw ServiceError.conflict("Task does not exist");
  }
  // Rethrow we don't know what happened
  throw error;
};

export default handleDBError;
