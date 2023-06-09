    new Vue({
    el: "#app",
    delimiters: ["<%", "%>"],
    data() {
      return {
        error:false,
        flags: window.flags,
        bmsId: 0,
        mode: 0,
        extraMode: 0,
        bmId: 0,
        isLoading: true,
        isLoadingScores: true,
        bmInfo: {},
        currentMap: undefined,
        currentScores: undefined,
        currentDiffs: [],
        leaderboard: {},
        modes: [],
        sort: "score",
      };
    },
    created() {
      this.LoadData(bmsId, mode, bmId);
      this.GetBeatmapSetInfo();
      this.DefaultSort();
    },
    methods: {
      modsStr(mod) {
        const numbermods = [
            {mod_text: "MR", mod_bit: 1 << 30},
            {mod_text: "V2", mod_bit: 1 << 29},
            {mod_text: "2K", mod_bit: 1 << 28},
            {mod_text: "3K", mod_bit: 1 << 27},
            {mod_text: "1K", mod_bit: 1 << 26},
            {mod_text: "KC", mod_bit: 1 << 25},
            {mod_text: "9K", mod_bit: 1 << 24},
            {mod_text: "TG", mod_bit: 1 << 23},
            {mod_text: "CN", mod_bit: 1 << 22},
            {mod_text: "RD", mod_bit: 1 << 21},
            {mod_text: "FI", mod_bit: 1 << 20},
            {mod_text: "8K", mod_bit: 1 << 19},
            {mod_text: "7K", mod_bit: 1 << 18},
            {mod_text: "6K", mod_bit: 1 << 17},
            {mod_text: "5K", mod_bit: 1 << 16},
            {mod_text: "4K", mod_bit: 1 << 15},
            {mod_text: "PF", mod_bit: 1 << 14},
            {mod_text: "AP", mod_bit: 1 << 13},
            {mod_text: "SO", mod_bit: 1 << 12},
            {mod_text: "AU", mod_bit: 1 << 11},
            {mod_text: "FL", mod_bit: 1 << 10},
            {mod_text: "NC", mod_bit: 1 << 9},
            {mod_text: "HT", mod_bit: 1 << 8},
            {mod_text: "RX", mod_bit: 1 << 7},
            {mod_text: "DT", mod_bit: 1 << 6},
            {mod_text: "SD", mod_bit: 1 << 5},
            {mod_text: "HR", mod_bit: 1 << 4},
            {mod_text: "HD", mod_bit: 1 << 3},
            {mod_text: "TD", mod_bit: 1 << 2},
            {mod_text: "EZ", mod_bit: 1 << 1},
            {mod_text: "NF", mod_bit: 1}
        ]
        let mod_text = '';
        let mod_num = 0
        if (!isNaN(mod)) {
            mod_num = mod
            let bit = mod.toString(2)
            let fullbit = "0000000000000000000000000000000".substring(bit.length) + bit
            for (let i = 30; i >= 0; i--) {
                if (fullbit[i] == 1)  {
                    mod_text += numbermods[i].mod_text
                }
            }
        } else {
            mod = mod.toUpperCase()
            if (mod !== 'NM') {
                for (let i = 0; i < mod.length / 2; i++) {
                    let find_mod = numbermods.find(m => m.mod_text == mod.substring(i*2, 2))
                    mod_text += find_mod.mod_text
                    mod_num |= find_mod.mod_bit
                }
            }
        }
        if (mod_text.includes('NC') && mod_text.includes('DT')) mod_text = mod_text.replace('DT', '');
        if (mod_text.includes('PF') && mod_text.includes('SD')) mod_text = mod_text.replace('SD', '');
        if (mod_num == 0) mod_text += '';
        return mod_text;
    },
      LoadData(bmsId, mode, bmId) {
        this.$set(this, "bmsId", bmsId);
        this.$set(this, "mode", this.ModeStrToInt(mode));
        this.$set(this, "bmId", bmId);
        this.$set(this, "extraMode", this.ModeStrToInt(extraMode, true));
        // console.log(this.bmsId, this.mode, this.bmId);
      },
      ChangeSort(sort) {
        if (this.sort === sort) return;
        this.$set(this, "sort", sort);
        this.GetBeatmapScores();
      },
      DefaultSort() {
        if (this.extraMode === 0) this.$set(this, "sort", "score");
        else {
          this.$set(this, "sort", "pp");
        }
      },
      ModeIntToStr(integer, isExtraMode = false) {
        if (isExtraMode === false) {
          switch (integer) {
            case 0:
              return "std";
            case 1:
              return "taiko";
            case 2:
              return "catch";
            case 3:
              return "mania";
          }
        } else {
          switch (integer) {
            case 0:
              return "vn";
            case 4:
              return "rx";
            case 8:
              return "ap";
          }
        }
        return "vn"
      },
      ModeStrToInt(str, isExtraMode = false) {
        if (isExtraMode === false) {
          switch (str) {
            case "std":
              return 0;
            case "taiko":
              return 1;
            case "catch":
              return 2;
            case "mania":
              return 3;
          }
        } else {
          switch (str) {
            case "vn":
              return 0;
            case "rx":
              return 4;
            case "ap":
              return 8;
          }
        }
        return 0
      },

      UpdateUrl() {
        window.history.replaceState(
          "",
          document.title,
          `/beatmapsets/${this.bmsId}/${this.ModeIntToStr(this.mode)}/${
            this.bmId
          }/${this.ModeIntToStr(this.extraMode, true)}`
        );
      },
      SetCurrentMap(currentMap) {
        this.$set(this, "currentMap", currentMap);
        this.$set(this, "bmId", currentMap.id);
        this.$set(this, "bmsId", currentMap.set_id);
        if (currentMap.mode !== 0 || !mode) {
          // Set mode state only if map isn't from std or mode state is undefined, to account for std converts
          this.$set(this, "mode", currentMap.mode);
        }
        this.UpdateUrl();
        document.title = currentMap.title;
      },
      AddMode(mode) {
        if (!this.modes.includes(mode)) {
          this.$set(this, "modes", [...this.modes, mode]);
        }
      },
      AddAllModes() {
          if (!this.modes.includes(mode)) {
            this.$set(this, "modes", [0, 1, 2, 3]);
          }
        }
      ,
      ChangeDiff(diffId) {
        this.$set(this, "bmId", diffId);
        this.LoadBeatmapInfo();
      },
      ChangeMode(mode) {
        if (mode === this.mode) return;

        if (this.currentMap.mode !== 0) {
          // Only set to undefined if current map isn't from standard, because std maps will show on any modes, so it'll still be there select, no need to reselect another one
          this.$set(this, "bmId", undefined);
        }

        this.$set(this, "mode", mode);
        this.$set(this, "extraMode", 0);
        this.LoadBeatmapInfo();
      },
      ChangeExtraMode(extraMode) {
        if (extraMode === this.extraMode) return;
        this.$set(this, "extraMode", extraMode);
        this.DefaultSort();
        this.UpdateUrl();
        this.GetBeatmapScores();
      },

      async GetBeatmapInfo() {
        try {
          let response = await this.$axios.get(
            `https://api.${domain}/v1/get_map_info?id=${this.bmId}`
          );
          this.$set(this, "currentMap", response.data.map);
          this.$set(this, "bmsId", response.data.map.set_id);
          this.LoadBeatmapInfo();
        } catch {
          this.$set(this, "isLoading", false);
        }
      },
      async GetBeatmapSetInfo() {
        if (this.bmsId === "None" && this.bmId !== undefined) {
          await this.GetBeatmapInfo();
        }

        this.$axios
          .get(`https://api.${domain}/v1/get_set_info?id=${this.bmsId}`)
          .then((response) => {
            this.$set(this, "bmInfo", response.data.map);
            this.LoadBeatmapInfo();
          })
          .catch(() => {
            this.$set(this, "error", true)
            this.$set(this, "isLoading", false);
          });
      },
      LoadBeatmapInfo() {
        this.$set(this, "currentDiffs", []);
        this.$set(this, "currentMap", undefined);
        this.$set(this, "currentScores", undefined);
        
        // Loop through all maps
        for (const [key, value] of Object.entries(this.bmInfo.maps)) {
          if (this.bmId !== undefined) {
            // bmId state exists
            if (value.id == this.bmId) {
              // set currentMap state to map that matches bmId 
              this.SetCurrentMap(value);
              break;
            }
          } else {
            // bmId doesnt exist
            if (value.mode == this.mode || value.mode === 0) {
              this.SetCurrentMap(value);
              break;
            }
          }
        }

        if (!this.currentMap) {
          this.SetCurrentMap(this.bmInfo.maps[0]);
        }
        
        this.bmInfo.maps.forEach((element) => {
          
          if (element.mode === 0) {
            this.AddAllModes() // ADDS ALL MODES IF STD MAP EXISTS, BECAUSE IT CAN BE PLAYED AS A CONVERT
            // cannot break loop, will rewrite function another time
          } else {
            this.AddMode(element.mode);
          }

          if (element.mode === this.mode || element.mode === 0) { 
            // Add diff to diff selector if map mode is equal to selected mode or if map mode is equal to std (because of converts)
            this.$set(this, "currentDiffs", [...this.currentDiffs, element]);
          }
        });

        this.$set(
          this,
          "currentDiffs",
          this.currentDiffs.sort((a, b) => {
            return b.diff - a.diff;
          })
        );

        this.UpdateUrl();
        this.GetBeatmapScores();
        this.$set(this, "isLoading", false);
      },
      GetBeatmapScores() {
        this.$set(this, "isLoadingScores", true);
        this.$set(this, "currentScores", undefined);

        this.$axios
          .get(`https://api.${domain}/v1/get_map_scores`, {
            params: {
              scope: "best",
              sort: this.sort,
              id: this.bmId,
              mode: this.mode + this.extraMode,
            },
          })
          .then((response) => {
            this.$set(this, "currentScores", response.data.scores);
            this.$set(this, "isLoadingScores", false);
          })
          .catch(() => {
            this.$set(this, "isLoadingScores", false);
          });
      },
    },
    });
