// @flow
import * as React from 'react';
import { Component, PropTypes } from '../../libs';

import type {
  TableProps,
  TableLayoutState,
} from './Types';
import th from "../locale/lang/th";

import {flattenColumns, getScrollBarWidth} from "./utils";

export default function TableLayoutHOC(WrapedComponent: React.ComponentType<TableProps & { layout: TableState }>): React.ComponentType<TableProps & { layout: TableState }> {
  return class TableLayout extends Component {
    static childContextTypes = {
      store: PropTypes.object,
    };

    constructor(props) {
      super(props);
      this.state = {
        // fit: props.fit,
        // show
        gutterWidth: getScrollBarWidth(),
        tableHeight: null,
        headerHeight: null,
        bodyHeight: null,
        footerHeight: null,
        fixedBodyHeight: null
      };
    }

    componentDidMount() {
      this.el = this.table.el;

      this.update();
      this.updateHeight();
    }

    componentDidUpdate(preProps) {

    }

    getChildContext() {
      layout: this;
    }

    update() {
      const { store: { columns, fixedColumns, rightFixedColumns }, fit } = this.props;
      const { gutterWidth } = this.state;
      const bodyMinWidth = columns.reduce((pre, col) => pre + (col.width || col.minWidth), 0);

      let bodyWidth = this.table.el.clientWidth;
      let scrollX;
      let fixedWidth;
      let rightFixedWidth;

      // mutate TableStore's state(columns), thinking to avoid(move columns from store to layout)
      const flexColumns = columns.filter(column => typeof column.width !== 'number');
      if (flexColumns.length && fit) {
        // console.log(columns,bodyWidth, gutterWidth);
        if (bodyMinWidth < bodyWidth - gutterWidth) { // no scroll bar
          scrollX = false;

          const totalFlexWidth = bodyWidth - gutterWidth - bodyMinWidth;
          if (flexColumns.length === 1) {
            flexColumns[0].realWidth = flexColumns[0].minWidth + totalFlexWidth;
          } else {
            const allColumnsWidth = flexColumns.reduce((pre, col) => pre + col.minWidth, 0);
            const flexWidthPerPixel = totalFlexWidth / allColumnsWidth;

            let widthWithoutFirst = 0;

            flexColumns.forEach((column, index) => {
              if (index === 0) return;
              const flexWidth = Math.floor(column.minWidth * flexWidthPerPixel);
              widthWithoutFirst += flexWidth;
              column.realWidth = column.minWidth + flexWidth;
            });

            flexColumns[0].realWidth = flexColumns[0].minWidth + totalFlexWidth - widthWithoutFirst;
          }
        } else { // have horizontal scroll bar
          scrollX = true;
        }

        bodyWidth = Math.max(bodyMinWidth, bodyWidth);
      } else {
        scrollX = bodyMinWidth > bodyWidth;
        bodyWidth = bodyMinWidth;
      }

      if (fixedColumns.length) {
        fixedWidth = fixedColumns.reduce((pre, col) => pre + col.realWidth, 0);
      }

      if (rightFixedColumns.length) {
        rightFixedWidth = rightFixedColumns.reduce((pre, col) => pre + col.realWidth, 0);
      }

      this.setState({
        scrollX,
        bodyWidth,
        fixedWidth,
        rightFixedWidth
      });
    }

    updateHeight() {
      const { data, height, showHeader } = this.props;
      const { scrollX, gutterWidth } = this.state;
      const tableHeight = this.el.clientHeight;
      const noData = !data || !data.length;
      const { headerWrapper, footerWrapper } = this.table;

      const footerHeight = footerWrapper ? footerWrapper.offsetHeight : 0;

      let headerHeight;
      let bodyHeight;
      let fixedBodyHeight;
      if (!showHeader) {
        headerHeight = 0;
        if (height && (!isNaN(height) || typeof height === 'string')) {
          bodyHeight = tableHeight - footerHeight + (footerWrapper ? 1 : 0);
        }
        fixedBodyHeight = scrollX ? tableHeight - gutterWidth : tableHeight;
      } else {
        headerHeight = headerWrapper.offsetHeight;
        if (height && (!isNaN(height) || typeof height === 'string')) {
          bodyHeight = tableHeight - headerHeight - footerHeight + (footerWrapper ? 1 : 0);
        }
        fixedBodyHeight = scrollX ? tableHeight - (noData ? 0 : gutterWidth) : tableHeight;
      }

      this.setState({
        tableHeight,
        headerHeight,
        bodyHeight,
        footerHeight,
        fixedBodyHeight
      });
    }

    render() {
      return (
        <WrapedComponent
          ref={(table) => { this.table = table; }}
          {...this.props}
          layout={this.state}
        />
      )
    }
  }
}