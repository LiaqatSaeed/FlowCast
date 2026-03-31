const router = require('express').Router();
const supabase = require('../lib/supabase');

/**
 * GET /api/analytics
 * Aggregate stats across all channels.
 * Query: ?days=30 (default 30)
 */
router.get('/', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceDate = since.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .gte('date', sinceDate)
      .order('date', { ascending: false });

    if (error) throw error;

    // Aggregate totals
    const totals = data.reduce(
      (acc, row) => {
        acc.views += row.views;
        acc.new_subscribers += row.new_subscribers;
        acc.watch_time_seconds += row.watch_time_seconds;
        acc.revenue += parseFloat(row.revenue) || 0;
        return acc;
      },
      { views: 0, new_subscribers: 0, watch_time_seconds: 0, revenue: 0 }
    );

    // Group by date for chart data
    const byDate = {};
    for (const row of data) {
      if (!byDate[row.date]) {
        byDate[row.date] = { date: row.date, views: 0, new_subscribers: 0, revenue: 0 };
      }
      byDate[row.date].views += row.views;
      byDate[row.date].new_subscribers += row.new_subscribers;
      byDate[row.date].revenue += parseFloat(row.revenue) || 0;
    }

    const chartData = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: { totals, chartData, rows: data },
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/:channelId
 * Per-channel analytics with optional date range.
 * Query: ?start=YYYY-MM-DD&end=YYYY-MM-DD&days=30
 */
router.get('/:channelId', async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const days = parseInt(req.query.days, 10) || 30;

    let startDate = req.query.start;
    let endDate = req.query.end;

    if (!startDate) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      startDate = since.toISOString().split('T')[0];
    }
    if (!endDate) {
      endDate = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('channel_id', channelId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;

    const totals = data.reduce(
      (acc, row) => {
        acc.views += row.views;
        acc.new_subscribers += row.new_subscribers;
        acc.watch_time_seconds += row.watch_time_seconds;
        acc.revenue += parseFloat(row.revenue) || 0;
        acc.avg_ctr = data.length
          ? data.reduce((s, r) => s + parseFloat(r.avg_ctr || 0), 0) / data.length
          : 0;
        return acc;
      },
      { views: 0, new_subscribers: 0, watch_time_seconds: 0, revenue: 0, avg_ctr: 0 }
    );

    res.json({
      success: true,
      data: { channelId, startDate, endDate, totals, rows: data },
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
