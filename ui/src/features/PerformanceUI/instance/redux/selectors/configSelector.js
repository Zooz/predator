export const config = (state) => state.ConfigReducer.get('config');
export const errorOnGetConfig = (state) => state.ConfigReducer.get('error_get_config');
export const errorOnUpdateConfig = (state) => state.ConfigReducer.get('error_update_config');
export const configDataMap = (state) => state.ConfigReducer.get('config_data_map');
export const processingGetConfig = (state) => state.ConfigReducer.get('processing_get_config');
export const processingUpdateConfig = (state) => state.ConfigReducer.get('processing_update_config');
export const processGetConfigDataMap = (state) => state.ConfigReducer.get('processing_get_config_data_map');
