import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  Box,
} from '@mui/material';
import { NETWORKS } from '../utils/constants';

const TokenSelectModal = ({ open, onClose, onSelect, excludeToken }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const tokens = Object.entries(NETWORKS.DEFI_ORACLE_META_MAINNET.tokens)
    .filter(([symbol, address]) => 
      address !== excludeToken &&
      symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Token</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>
        <List sx={{ pt: 0 }}>
          {tokens.map(([symbol, address]) => (
            <ListItem
              button
              onClick={() => onSelect({ symbol, address })}
              key={address}
            >
              <ListItemAvatar>
                <Avatar
                  src={`/token-icons/${symbol.toLowerCase()}.png`}
                  alt={symbol}
                />
              </ListItemAvatar>
              <ListItemText primary={symbol} secondary={address} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelectModal; 