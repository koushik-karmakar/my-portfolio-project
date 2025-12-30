import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export const AlertBox = async (type, message, statusCode) => {
  await Swal.fire({
    icon: type,
    title: message,
    text: statusCode ? `Status Code: ${statusCode}` : "",
    showConfirmButton: true,
    confirmButtonText: "OK",
    confirmButtonColor:
      type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#3085d6",
  });
};

export const ConfirmBox = async (
  title = "Are you sure?",
  text = "You won't be able to revert this!",
  confirmText = "Yes, delete it!"
) => {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  return result.isConfirmed;
};
