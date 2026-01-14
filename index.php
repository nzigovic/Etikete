<?php
require 'auth.php';
require_login();
enforce_session_timeout();
?>
<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8">
  <title>Medikacione etikete</title>
  <link rel="stylesheet" href="style.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js" defer></script> 
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>
</head>
<body>

<div class="bg"></div>

<div class="wrapper">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
    <h1 style="margin:0;"> Medikacione etikete</h1>
    <div style="display:flex;align-items:center;gap:10px;font-weight:600;">
      <span><?php echo htmlspecialchars($_SESSION['username'] ?? 'Korisnik', ENT_QUOTES, 'UTF-8'); ?></span>
      <a href="logout.php" class="gray" style="padding:8px 12px;border-radius:10px;text-decoration:none;border:1px solid #ccc;">Odjava</a>
    </div>
  </div>

  <div class="app">

    <!-- LEVO -->
    <div class="card">
      <div style="display:flex; align-items:center; gap:10px; justify-content:space-between;">
        <h2 style="margin:0;">Pacijent</h2>
        <button id="resetInputs" class="gray" type="button" style="height:30px; padding:0 8px; font-size:0.8rem; white-space:nowrap; width:auto; min-width:0;">🔄 Reset</button>
      </div>

      <label>Pacijent</label>
      <input id="patient" placeholder="Unesite Pacijenta">

      <label>Soba</label>
      <select id="room">
        <option value="">---</option>
        <option>42</option><option>44</option><option>46</option><option>48</option>
        <option>52</option><option>54</option><option>56</option><option>58</option>
        <option>60</option><option>62</option><option>66</option><option>68</option>
        <option>43</option><option>47</option><option>70</option><option>74</option>
        <option>82</option><option>86</option><option>88</option><option>92</option>
        <option>94</option><option>98</option><option>100</option>
      </select>

      <hr>

      <h2>Terapija</h2>

      <label>Lek</label>
      <select id="drug">
        <option value="">---</option>
        <option>Meropenem</option>
        <option>Tacobac</option>
        <option>P40</option>
        <option>Clont</option>
        <option>Vomex</option>
        <option>Jono</option>
        <option>MCP</option>
        <option>Nov</option>
        <option>Targin</option>
        <option>Smof</option>
        <option>Clexane</option>
        <option value="custom">Drugi (ručno)</option>
      </select>

      <input id="customDrug" placeholder="Upiši lek" style="display:none">

      <label>Doza</label>
      <input id="dose" placeholder="npr. 1g / 500ml">

      <!-- SMOF -->
      <div id="smofBox" class="special">
        <label>SMOF tip</label>
        <select id="smofType">
          <option>Smof(Z) 970ml</option>
          <option>Smof(Z) 1477ml</option>
          <option>Smof(Z) 1970ml</option>
          <option>Smof(P)</option>
        </select>

        <label class="inline">
          <input type="checkbox" id="smofZusatz" style="width:10%">
          + Zusatz
        </label>
      </div>

      <!-- CLEXANE -->
      <div id="clexaneBox" class="special">
        <label>Clexane doza</label>
        <select id="clexaneDose">
          <option>0,4</option>
          <option>0,6</option>
          <option>0,8</option>
          <option value="custom">Drugo</option>
        </select>
        <input id="clexaneCustom" placeholder="Upiši dozu" style="display:none">
      </div>

      <!-- TARGIN -->
      <div id="targinBox" class="special" style="display:none;">
        <label>Targin doza</label>
        <select id="targinDose">
          <option>5/2,5</option>
          <option>10/5</option>
          <option>20/10</option>
        </select>
      </div>
      
      <!-- JONO VOLUME -->
      <div id="jonoBox" class="special" style="display:none;">
        <label>Jono zapremina</label>
        <div class="inline">
          <label class="inline"><input type="radio" name="jonoVolume" id="jono1L" value="1L"> 1L</label>
          <label class="inline"><input type="radio" name="jonoVolume" id="jono500" value="500ml"> 500ml</label>
        </div>
      </div>
      <label>Učestalost</label>
<select id="frequency">
  <option value="1">1× (05h)</option>
  <option value="2">2× (05 / 20)</option>
  <option value="3" selected>3× (05 / 14 / 22)</option>
  <option value="4">4× (05 / 12 / 18 / 22)</option>
</select>
      <label>Vreme (h) – ručno</label>
      <input id="customTime" type="number" min="0" max="23" step="1" placeholder="npr. 8 za 08h">
      <button class="blue" onclick="addSamePatient()">➕ Dodaj (isti pacijent)</button>
      <button class="green" onclick="addNextPatient()">➡ Sledeći pacijent</button>
    </div>

    <!-- DESNO -->
    <div class="card big">
      <div class="top">
        <h2>Pregled etiketa</h2>
        <span id="counter">0 / 79</span>
      </div>

      <div id="preview" class="preview"></div>

      <button onclick="undo()" class="gray">↩ Undo</button>
      <button id="exportWord" class="blue">📄 Exportuj Word</button>
      <button onclick="exportPDF()" class="blue">📄 Exportuj PDF</button>
      <button onclick="resetAll()" class="red">Reset</button>
    </div>

  </div>
</div>

<script src="app.js" defer></script>
</body>
</html>
