import { AlertModalProps } from '@/types';
import React from 'react';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

const Alert: React.FC<AlertModalProps> = ({
  title,
  text,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancelButton = false,
  onConfirm,
  onCancel,
}) => {
  const handleShow = async () => {
    const result: SweetAlertResult<any> = await Swal.fire({
      title,
      text,
      icon: type,
      showCancelButton,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      customClass: {
        popup: 'bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 shadow-xl text-white',
        title: 'text-2xl font-bold mb-2',
        actions: 'mt-4 flex justify-center gap-2',
        confirmButton: 'bg-white text-purple-600 font-semibold px-4 py-2 rounded hover:bg-gray-100',
        cancelButton: 'bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300',
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed && onConfirm) onConfirm();
    if (result.isDismissed && onCancel) onCancel();
  };

  return (
    <button
      onClick={handleShow}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
      Show Alert
    </button>
  );
};

export default Alert;