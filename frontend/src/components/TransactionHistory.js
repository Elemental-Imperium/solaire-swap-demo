import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { formatDistance } from 'date-fns';
import { ethers } from 'ethers';

const TransactionHistory = ({ provider, account }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('timestamp');
  const [order, setOrder] = useState('desc');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (provider && account) {
      fetchTransactions();
    }
  }, [provider, account]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const currentBlock = await provider.getBlockNumber();
      const events = await Promise.all([
        fetchVaultEvents(currentBlock),
        fetchSwapEvents(currentBlock),
      ]);
      
      const allTransactions = events
        .flat()
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredTransactions = transactions.filter((tx) =>
    tx.type.toLowerCase().includes(filter.toLowerCase()) ||
    tx.hash.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedTransactions = filteredTransactions.sort((a, b) => {
    const isAsc = order === 'asc';
    if (orderBy === 'timestamp') {
      return isAsc ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    }
    return isAsc ? a[orderBy] > b[orderBy] : b[orderBy] > a[orderBy];
  });

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <Box p={2}>
        <TextField
          fullWidth
          label="Filter transactions"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          margin="normal"
        />
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'timestamp'}
                  direction={orderBy === 'timestamp' ? order : 'asc'}
                  onClick={() => handleSort('timestamp')}
                >
                  Time
                </TableSortLabel>
              </TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTransactions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((tx) => (
                <TableRow key={tx.hash}>
                  <TableCell>
                    {formatDistance(tx.timestamp * 1000, new Date(), { addSuffix: true })}
                  </TableCell>
                  <TableCell>{tx.type}</TableCell>
                  <TableCell>{ethers.utils.formatEther(tx.amount)} ETH</TableCell>
                  <TableCell>{tx.status}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredTransactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </Paper>
  );
};

export default TransactionHistory; 