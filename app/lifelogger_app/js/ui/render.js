import { renderTypes } from './quick-log.js';
import { renderRecent } from './recent.js';
import { renderCalendar } from './calendar.js';
import { renderSelectors, drawChart } from './chart.js';

export function renderAll(){
  renderTypes(); renderRecent(); renderCalendar(); renderSelectors(); drawChart();
}
