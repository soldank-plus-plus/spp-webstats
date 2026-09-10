// The cross-entity listings join map and user and hand out the whole dataset a
// page at a time, so they are both the heaviest queries here and the obvious
// target for scraping. A visitor paging through such a table by hand stays far
// below this
export const HEAVY_ENDPOINT_LIMIT = 40;
