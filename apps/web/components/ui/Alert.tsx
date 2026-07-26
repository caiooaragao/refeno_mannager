interface AlertProps {
  type: "success" | "error";
  message: string;
}

export function Alert({ type, message }: AlertProps) {
  const isSuccess = type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className="mb-5 rounded-lg px-4 py-3 text-sm"
      style={{
        backgroundColor: isSuccess ? "#e6f4ed" : "#fde8e8",
        color: isSuccess ? "#1a7f4b" : "#b91c1c",
        border: isSuccess ? "1px solid #a7d9be" : "1px solid #f5b8b8",
      }}
    >
      {message}
    </div>
  );
}
