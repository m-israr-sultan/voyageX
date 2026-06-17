import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const SKIP = new Set(['node_modules', '.next', 'out', 'dist']);

const pairs = [
  ['/Booking/BillingDetail/', '/booking/billingdetail/'],
  ['/Booking/TravelDetail/', '/booking/traveldetail/'],
  ['/Booking/Confirmation/', '/booking/confirmation/'],
  ['/Register/TouristRegistration', '/register/touristregistration'],
  ['/Register/AgencyRegistration', '/register/agencyregistration'],
  ['/Register/GuideRegistration', '/register/guideregistration'],
  ['/Admin/Dashboard', '/admin/dashboard'],
  ['/ShareExperience', '/shareexperience'],
  ['/ResetPassword', '/resetpassword'],
  ['/CreatePassword', '/createpassword'],
  ['/Messages/', '/message/'],
  ['/Destination/', '/destination/'],
  ['/Packages/', '/packages/'],
  ['/Agency/', '/agency/'],
  ['/Guide/', '/guide/'],
  ['/Message/', '/message/'],
  ['/Customize', '/customize'],
  ['/Report', '/report'],
  ['/Login', '/login'],

  ['/Otp?', '/otp?'],
  ['/Register', '/register'],
  ['/Booking', '/booking'],
  ['/Packages', '/packages'],
  ['/Agency', '/agency'],
  ['/Destination', '/destination'],
  ['/Guide', '/guide'],
  ['/Otp', '/otp']
];

const exts = new Set(['.tsx', '.ts', '.jsx', '.js', '.css']);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP.has(ent.name)) continue;
      walk(p, out);
    } else if (exts.has(path.extname(ent.name))) {
      out.push(p);
    }
  }
  return out;
}

let n = 0;
for (const file of walk(root)) {
  let c = fs.readFileSync(file, 'utf8');
  const orig = c;
  for (const [from, to] of pairs) c = c.split(from).join(to);
  if (c !== orig) {
    fs.writeFileSync(file, c);
    n++;
  }
}
console.log('updated', n, 'files');
