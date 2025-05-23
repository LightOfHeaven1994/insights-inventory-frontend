import flatMap from 'lodash/flatMap';
import {
  HOST_GROUP_CHIP,
  RHCD_FILTER_KEY,
  UPDATE_METHOD_KEY,
  SYSTEM_TYPE_KEY,
} from '../../../Utilities/constants';

const mapTags = ({ category, values }) =>
  values.map(
    ({ tagKey, value }) =>
      `${category ? `${category}/` : ''}${tagKey}${value ? `=${value}` : ''}`,
  );

const filterMapper = {
  staleFilter: ({ staleFilter }, searchParams) =>
    staleFilter.forEach((item) => searchParams.append('status', item)),
  osFilter: ({ osFilter }, searchParams) => {
    // TODO This is very hackish. There should be a schema/feature on how the values translate into params
    const osParams = Object.entries(
      Object.values(osFilter).reduce((acc, item) => ({ ...acc, ...item }), {}),
    )
      .filter(([, value]) => value === true)
      .map(([key]) => key);

    osParams.forEach((item) => {
      const keyParts = item.split('-');
      const [osName, value] = [
        keyParts.slice(0, keyParts.length - 2).join(' '),
        keyParts[keyParts.length - 1],
      ];

      if (value && osName) {
        searchParams.append('operating_system', `${osName}${value}`);
      }
    });
  },
  registeredWithFilter: ({ registeredWithFilter }, searchParams) =>
    registeredWithFilter?.forEach((item) =>
      searchParams.append('source', item),
    ),
  value: ({ value, filter }, searchParams) =>
    value === 'hostname_or_id' &&
    Boolean(filter) &&
    searchParams.append('hostname_or_id', filter),
  tagFilters: ({ tagFilters }, searchParams) =>
    tagFilters?.length > 0 &&
    searchParams.append('tags', flatMap(tagFilters, mapTags)),
  rhcdFilter: ({ rhcdFilter }, searchParams) =>
    rhcdFilter?.forEach((item) => searchParams.append(RHCD_FILTER_KEY, item)),
  lastSeenFilter: ({ lastSeenFilter }, searchParams) =>
    Object.keys(lastSeenFilter || {})?.forEach(
      (item) =>
        item === 'mark' &&
        searchParams.append('last_seen', lastSeenFilter[item]),
    ),
  updateMethodFilter: ({ updateMethodFilter }, searchParams) =>
    updateMethodFilter?.forEach((item) =>
      searchParams.append(UPDATE_METHOD_KEY, item),
    ),
  hostGroupFilter: ({ hostGroupFilter }, searchParams) =>
    hostGroupFilter?.forEach((item) =>
      searchParams.append(HOST_GROUP_CHIP, item),
    ),
  systemTypeFilter: ({ systemTypeFilter }, searchParams) =>
    systemTypeFilter?.forEach((item) =>
      searchParams.append(SYSTEM_TYPE_KEY, item),
    ),
};

// TODO It might be better to not use a SearchParam instance and mutate it
// This should rather just return a plain object that can be
// applied with react routers useSearch params.
export const calculateFilters = (searchParams, filters = []) => {
  filters.forEach((filter) => {
    Object.keys(filter).forEach((key) => {
      filterMapper?.[key]?.(filter, searchParams);
    });
  });
  return searchParams;
};

export const calculatePagination = (searchParams, page, perPage) => {
  const currSearch = new URLSearchParams(location.search);
  const newPage = page !== undefined ? page : currSearch.get('page');
  const newPerPage =
    perPage !== undefined ? perPage : currSearch.get('per_page');
  if (!isNaN(parseInt(newPage))) searchParams.append('page', newPage);
  if (!isNaN(parseInt(newPerPage))) searchParams.append('per_page', newPerPage);
};

export const calculateSorting = (searchParams, sortBy) => {
  if (sortBy != null && sortBy?.key != null) {
    const sort = sortBy.direction === 'desc' ? `-${sortBy.key}` : sortBy.key;
    searchParams.append('sort', sort);
  }
};
