import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Paper, Box, Typography, Select, MenuItem } from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PriceChart = ({ priceFeed }) => {
  const [timeframe, setTimeframe] = useState('24h');
  const [priceData, setPriceData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    fetchPriceData(timeframe);
  }, [timeframe, priceFeed]);

  const fetchPriceData = async (period) => {
    try {
      const rounds = await getPriceRounds(period);
      const data = await Promise.all(
        rounds.map(async (roundId) => {
          const [, price, , timestamp] = await priceFeed.getRoundData(roundId);
          return {
            price: price.toNumber() / 1e8,
            timestamp: timestamp.toNumber(),
          };
        })
      );

      setPriceData({
        labels: data.map((d) => new Date(d.timestamp * 1000).toLocaleTimeString()),
        datasets: [
          {
            label: 'ETH Price (USD)',
            data: data.map((d) => d.price),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch price data:', error);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">ETH Price Chart</Typography>
        <Select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          size="small"
        >
          <MenuItem value="1h">1 Hour</MenuItem>
          <MenuItem value="24h">24 Hours</MenuItem>
          <MenuItem value="7d">7 Days</MenuItem>
          <MenuItem value="30d">30 Days</MenuItem>
        </Select>
      </Box>
      <Line
        data={priceData}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
          },
          scales: {
            y: {
              beginAtZero: false,
            },
          },
        }}
      />
    </Paper>
  );
};

export default PriceChart; 