import { reactive, toRefs } from 'vue';

const state = reactive({
  visible: false,
  type: 'info', // 'info' | 'success' | 'error'
  title: '',
  message: '',
});

export const useNotifyStore = () => {
  const notify = (message, { type = 'info', title = '' } = {}) => {
    state.message = message;
    state.type = type;
    state.title = title;
    state.visible = true;
  };

  const notifySuccess = (message, title = '¡Listo!') => notify(message, { type: 'success', title });
  const notifyError = (message, title = 'Ocurrió un error') => notify(message, { type: 'error', title });

  const close = () => {
    state.visible = false;
  };

  return {
    ...toRefs(state),
    state,
    notify,
    notifySuccess,
    notifyError,
    close,
  };
};
