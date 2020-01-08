export const processorsList = (state) => state.ProcessorsReducer.get('processors');
export const processorsLoading = (state) => state.ProcessorsReducer.get('processors_loading');
export const processorFailure = (state) => state.ProcessorsReducer.get('processor_error');
export const createProcessorSuccess = (state) => state.ProcessorsReducer.get('create_processor_success');
export const deleteProcessorSuccess = (state) => state.ProcessorsReducer.get('delete_processor_success');
export const editProcessorSuccess = (state) => state.ProcessorsReducer.get('edit_processor_success');
export const deleteProcessorFailure = (state) => state.ProcessorsReducer.get('delete_processor_failure');
