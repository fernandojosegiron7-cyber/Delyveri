
export default async function handler(req, res) {
  try {
    const method = req.method || 'GET';

    let wpUrl = '';
    let action = '';
    let token = '';
    let status = '';
    let lat = '';
    let lng = '';
    let accuracy = '';

    if (method === 'GET') {
      wpUrl = String(req.query.wp || '');
      action = String(req.query.action || '');
      token = String(req.query.token || '');
    } else {
      const body = req.body || {};
      wpUrl = String(body.wp || '');
      action = String(body.action || '');
      token = String(body.token || '');
      status = String(body.status || '');
      lat = String(body.lat || '');
      lng = String(body.lng || '');
      accuracy = String(body.accuracy || '');
    }

    if (!wpUrl || !/^https:\/\/[^/]+\/wp-admin\/admin-ajax\.php(?:\?.*)?$/i.test(wpUrl)) {
      return res.status(400).json({ success:false, data:{ message:'URL AJAX de WordPress inválida' } });
    }

    const allowedActions = new Set([
      'fg_driver_order_info',
      'fg_get_driver_delivery_info',
      'fg_update_driver_location',
      'fg_driver_update_status',
  'fg_confirm_delivery_code',
  'fg_driver_chat',
  'fg_public_branding'
    ]);

    if (!allowedActions.has(action)) {
      return res.status(400).json({ success:false, data:{ message:'Acción no permitida' } });
    }

    let target = wpUrl;
    const headers = { 'Accept':'application/json' };
    const opts = { method, headers };

    if (method === 'GET') {
      const u = new URL(target);
      u.searchParams.set('action', action);
      u.searchParams.set('token', token);
      target = u.toString();
    } else {
      headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
      const params = new URLSearchParams({ action, token });
      if (status) params.set('status', status);
      if (lat) params.set('lat', lat);
      if (lng) params.set('lng', lng);
      if (accuracy) params.set('accuracy', accuracy);
      opts.body = params.toString();
    }

    const upstream = await fetch(target, opts);
    const raw = await upstream.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        success:false,
        data:{
          message:'WordPress no devolvió JSON',
          http_status: upstream.status,
          preview: raw.slice(0,180)
        }
      });
    }

    res.setHeader('Cache-Control','no-store');
    return res.status(upstream.status >= 400 ? upstream.status : 200).json(data);
  } catch (err) {
    return res.status(500).json({
      success:false,
      data:{ message:'Error del proxy: '+(err?.message || 'desconocido') }
    });
  }
}
