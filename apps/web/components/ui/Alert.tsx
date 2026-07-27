interface AlertProps {
  type: "success" | "error";
  message: string;
}

export function Alert({ type, message }: AlertProps) {
  const isSuccess = type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`mb-5 rounded-lg px-4 py-3 text-body-sm ${
        isSuccess
          ? "border border-primary/30 bg-primary-container/20 text-on-primary-container"
          : "border border-error/30 bg-error-container/30 text-error"
      }`}
    >
      {message}
    </div>
  );
}
