import * as actions from './actions'
import styleDefs from '../../_defaults.scss'

const buttonWidth = parseInt(styleDefs['button-width-size'])
const noScrollExtraPadding = parseInt(styleDefs['no-scroll-padding'])

export const initialState = {
  shouldScroll: false,
  enableScrollLeft: false,
  enableScrollRight: false,
  innerScrollWidth: 0,
  scrollWrapperWidth: 0,
  scrollXValue: 0,
  currentTabs: [],
  tabs:[],
  pageNumber: 1,

}

export default function reducer (state, action) {
  console.log('reducer got state',action)
  switch (action.type) {
    case actions.ON_MOUNT:
      return onMount(state, action)
    case actions.ON_RESIZE:
      return onResize(state, action)
    case actions.ON_SCROLL_LEFT:
      return onScrollLeft(state)
    case actions.ON_SCROLL_RIGHT:
      return onScrollRight(state)
    case actions.ON_TAB_SELECTION:
      return onTabSelection(state, action)
    default:
      return state
  }
}

function onMount(state, {innerScrollWidth, scrollWrapperWidth, currentTabs,tabs}) {

  //todo
  const shouldScroll = innerScrollWidth > scrollWrapperWidth - noScrollExtraPadding
  return {
    ...state,
    shouldScroll,
    innerScrollWidth,
    scrollWrapperWidth,
    enableScrollRight: shouldScroll,
    scrollXValue: shouldScroll ? buttonWidth : 0,
    currentTabs,
    tabs
  }
}

function onResize (state, {
  scrollWrapperWidth,
  tabOffsetLeft,
  tabWidth,
  innerScrollWidth
}) {


  if (state.scrollWrapperWidth !== scrollWrapperWidth || state.innerScrollWidth !== innerScrollWidth) {
    console.log('manor scrollWrapperWidth',scrollWrapperWidth);
    console.log('manor tab width',tabWidth);
    console.log('manor noScrollExtraPadding',noScrollExtraPadding);
    console.log('manor innerScrollWidth',innerScrollWidth);
    const maxNumberOfTabs = Math.floor(scrollWrapperWidth / tabWidth);
    console.log("manor maxNumberOfTabs",maxNumberOfTabs);
    // const page  todo fix here the new calculate of page
    const numberOfPages = Math.floor(state.tabs.length / maxNumberOfTabs) + 1;
    console.log("manor numberOfPages",numberOfPages);

    const pageNumber = state.pageNumber > numberOfPages ? 1 : state.pageNumber;
    const currentTabs = state.tabs.slice((pageNumber - 1) * maxNumberOfTabs, pageNumber * maxNumberOfTabs + 1);
    const tabsAndPageInfoState = {pageNumber,currentTabs,maxNumberOfTabs}


    const shouldScroll = numberOfPages > 1; //innerScrollWidth > scrollWrapperWidth - noScrollExtraPadding
    if (!shouldScroll) {
      return {
        ...state,
        shouldScroll,
        scrollWrapperWidth,
        innerScrollWidth,
        enableScrollLeft: false,
        enableScrollRight: false,
        scrollXValue: 0,
     ...tabsAndPageInfoState
      }
    }

    const nextState = onTabSelection({
      ...state,
      shouldScroll,
      scrollWrapperWidth,
      innerScrollWidth
    }, {
      tabOffsetLeft,
      tabWidth
    });

    // stick inner scroll to the right when resize more than th scrollXValue
    if (scrollWrapperWidth - buttonWidth > nextState.innerScrollWidth + nextState.scrollXValue) {
      return {
        ...nextState,
        enableScrollLeft: true,
        enableScrollRight: true,
        scrollXValue: scrollWrapperWidth - buttonWidth - nextState.innerScrollWidth,
        ...tabsAndPageInfoState

      }
    }

    // otherwise update scroll enabling
    return {
      ...nextState,
      enableScrollLeft: true,//nextState.scrollXValue < buttonWidth,
      enableScrollRight: true ,//innerScrollWidth + nextState.scrollXValue > scrollWrapperWidth - buttonWidth,
      ...tabsAndPageInfoState
    }
  }
  return state
}

function onScrollLeft (state) {
  const { enableScrollLeft, scrollXValue, scrollWrapperWidth,maxNumberOfTabs } = state
  if (!enableScrollLeft || state.pageNumber===1) {
    return state
  }
  const pageNumber = state.pageNumber -1;

  const currentTabs = state.tabs.slice((pageNumber - 1) * maxNumberOfTabs, pageNumber * maxNumberOfTabs + 1);
  const tabsAndPageInfoState = {pageNumber,currentTabs}


  // actual width is the total width, without the buttons width
  const actualContentWidth = scrollWrapperWidth - 2 * buttonWidth
  // the content to the left is larger than the scrolling container width
  if (Math.abs(scrollXValue - buttonWidth) > actualContentWidth) {
    return {
      ...state,
      scrollXValue: scrollXValue + actualContentWidth,
      enableScrollLeft: true,
      enableScrollRight: true,
      ...tabsAndPageInfoState
    }
  }
  // the content width to the left is smaller than the container width
  // scrolling all of it into the container
  return {
    ...state,
    scrollXValue: buttonWidth,
    enableScrollLeft: false,
    enableScrollRight: true,
    ...tabsAndPageInfoState

  }
}

function onScrollRight (state) {
  const { enableScrollRight, scrollXValue, innerScrollWidth, scrollWrapperWidth,maxNumberOfTabs } = state

  console.log("manor on scroll right",enableScrollRight)
  if (!enableScrollRight) {
    return state
  }
  // actual width
  const actualContentWidth = scrollWrapperWidth - 2 * buttonWidth
  // the inner scroll remain to the right is larger than the scrolling wrapper
  const pageNumber = state.pageNumber +1;

  const currentTabs = state.tabs.slice((pageNumber - 1) * maxNumberOfTabs, pageNumber * maxNumberOfTabs + 1);
  const tabsAndPageInfoState = {pageNumber,currentTabs}


  const nextState = {pageNumber};
  if (innerScrollWidth - Math.abs(scrollXValue - buttonWidth) - actualContentWidth > actualContentWidth) {
    return {
      ...state,
      scrollXValue: scrollXValue - actualContentWidth,
      enableScrollRight: true,
      enableScrollLeft: true,
      ...tabsAndPageInfoState
    }
  }
  // the inner scroll remaining width is smaller than the wrapper
  // scroll all of it from the right
  return {
    ...state,
    scrollXValue: actualContentWidth + buttonWidth - innerScrollWidth,
    enableScrollRight: false,
    enableScrollLeft: true,
    ...tabsAndPageInfoState

  }
}

function onTabSelection (state, { tabOffsetLeft, tabWidth }) {
  if (state.shouldScroll) {
    const { scrollXValue, scrollWrapperWidth, innerScrollWidth } = state
    // scrolling in the tab from the left
    if (scrollXValue + tabOffsetLeft < buttonWidth) {
      const nextScrollXValue = buttonWidth - tabOffsetLeft
      return {
        ...state,
        scrollXValue: nextScrollXValue,
        enableScrollRight: true,
        enableScrollLeft: nextScrollXValue < buttonWidth
      }
    } else if (scrollXValue + tabOffsetLeft + tabWidth > scrollWrapperWidth - buttonWidth) {
      // scrolling in the tab from the right
      const nextScrollXValue = scrollWrapperWidth - buttonWidth - (tabOffsetLeft + tabWidth)
      return {
        ...state,
        scrollXValue: nextScrollXValue,
        enableScrollRight: true,//tabOffsetLeft + tabWidth < innerScrollWidth,
        enableScrollLeft: true
      }
    }
  }
  return state
}
