import { BaseQuery } from './BaseQuery';
import { ParamAllocator } from './ParamAllocator';
import { UserError } from '../compiler/UserError';

const GRANULARITY_TO_INTERVAL = {
  day: 'day',
  week: 'week',
  hour: 'hour',
  minute: 'minute',
  second: 'second',
  month: 'month',
  quarter: 'quarter',
  year: 'year'
};

class PostgresParamAllocator extends ParamAllocator {
  paramPlaceHolder(paramIndex) {
    return `$${paramIndex + 1}`;
  }
}

export class PostgresQuery extends BaseQuery {
  newParamAllocator(expressionParams) {
    return new PostgresParamAllocator(expressionParams);
  }

  convertTz(field) {
    return `(${field}::timestamptz AT TIME ZONE '${this.timezone}')`;
  }

  timeGroupedColumn(granularity, dimension) {
    return `date_trunc('${GRANULARITY_TO_INTERVAL[granularity]}', ${dimension})`;
  }

  hllInit(sql) {
    return `hll_add_agg(hll_hash_any(${sql}))`;
  }

  hllMerge(sql) {
    return `round(hll_cardinality(hll_union_agg(${sql})))`;
  }

  countDistinctApprox(sql) {
    return `round(hll_cardinality(hll_add_agg(hll_hash_any(${sql}))))`;
  }

  sqlTemplates() {
    const templates = super.sqlTemplates();
    // eslint-disable-next-line no-template-curly-in-string
    templates.params.param = '${{ param_index + 1 }}';
    return templates;
  }
}
