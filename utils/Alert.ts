import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

interface AlertOptions {
  title?: string;
  text?: string;
  icon?: SweetAlertIcon;
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
}

export const showAlert = async ({
  title = 'Alert!',
  text = '',
  icon = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancelButton = false,
}: AlertOptions): Promise<SweetAlertResult<any>> => {
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
      popup: 'bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 shadow-xl text-white',
      title: 'text-2xl font-bold mb-2',
      actions: 'mt-4 flex justify-center gap-2',  // style buttons container
      confirmButton: 'bg-white text-purple-600 font-semibold px-4 py-2 rounded hover:bg-gray-100',
      cancelButton: 'bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300',
    },
    buttonsStyling: false,
  });
};