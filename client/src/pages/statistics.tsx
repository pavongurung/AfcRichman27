{/* Full Player Stats (same as Admin Table) */}
<div>
  <h4 className="text-lg font-semibold mb-4">Full Statistics</h4>
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow className="bg-secondary">
          <TableHead>APPEARANCE</TableHead>
          <TableHead>MOTM</TableHead>
          <TableHead>GOALS</TableHead>
          <TableHead>ASSISTS</TableHead>
          <TableHead>POSS WON</TableHead>
          <TableHead>POSS LOST</TableHead>
          <TableHead>POSS DIFF</TableHead>
          <TableHead>CLEAN SHEET</TableHead>
          <TableHead>🟨</TableHead>
          <TableHead>🟥</TableHead>
          <TableHead>SAVES</TableHead>
          <TableHead>PK SAVE</TableHead>
          <TableHead>AVG RATING</TableHead>
          <TableHead>SHOTS</TableHead>
          <TableHead>SHOT ACC (%)</TableHead>
          <TableHead>PASSES</TableHead>
          <TableHead>PASS ACC (%)</TableHead>
          <TableHead>DRIBBLES</TableHead>
          <TableHead>DRIBBLE SUC (%)</TableHead>
          <TableHead>TACKLES</TableHead>
          <TableHead>TACKLE SUC (%)</TableHead>
          <TableHead>OFFSIDES</TableHead>
          <TableHead>FOULS</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>{stats.appearance}</TableCell>
          <TableCell>{stats.motm}</TableCell>
          <TableCell>{stats.goals}</TableCell>
          <TableCell>{stats.assists}</TableCell>
          <TableCell>{stats.possessionWon}</TableCell>
          <TableCell>{stats.possessionLost}</TableCell>
          <TableCell>{stats.possessionDifference}</TableCell>
          <TableCell>{stats.cleanSheet}</TableCell>
          <TableCell>{stats.yellowCards}</TableCell>
          <TableCell>{stats.redCards}</TableCell>
          <TableCell>{stats.saves}</TableCell>
          <TableCell>{stats.pkSave}</TableCell>
          <TableCell>{stats.avgRating ? (stats.avgRating / 10).toFixed(1) : "0.0"}</TableCell>
          <TableCell>{stats.shots}</TableCell>
          <TableCell>{stats.shotAccuracy}%</TableCell>
          <TableCell>{stats.passes}</TableCell>
          <TableCell>{stats.passAccuracy}%</TableCell>
          <TableCell>{stats.dribbles}</TableCell>
          <TableCell>{stats.dribbleSuccessRate}%</TableCell>
          <TableCell>{stats.tackles}</TableCell>
          <TableCell>{stats.tackleSuccessRate}%</TableCell>
          <TableCell>{stats.offsides}</TableCell>
          <TableCell>{stats.foulsCommitted}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</div>
