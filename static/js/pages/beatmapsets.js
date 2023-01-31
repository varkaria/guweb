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
        this.$set(this, "mode", currentMap.mode);
        this.UpdateUrl();
        document.title = currentMap.title;
      },
      AddMode(mode) {
        if (!this.modes.includes(mode)) {
          this.$set(this, "modes", [...this.modes, mode]);
        }
      },
      ChangeDiff(diffId) {
        this.$set(this, "bmId", diffId);
        this.LoadBeatmapInfo();
      },
      ChangeMode(mode) {
        if (mode === this.mode) return;
        this.$set(this, "mode", mode);
        this.$set(this, "extraMode", 0);
        this.$set(this, "bmId", undefined);
        this.LoadBeatmapInfo();
      },
      ChangeExtraMode(extraMode) {
        if (extraMode === this.extraMode) return;
        this.$set(this, "extraMode", extraMode);
        this.DefaultSort();
        this.UpdateUrl();
        this.GetBeatmapScores();
      },
      PopulateDifficulties() {},
  
      async GetBeatmapInfo() {
        try {
          let response = await this.$axios.get(
            `https://api.${domain}/get_map_info?id=${this.bmId}`
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
          .get(`https://api.${domain}/get_set_info?id=${this.bmsId}`)
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
  
        for (const [key, value] of Object.entries(this.bmInfo.maps)) {
          if (this.bmId !== undefined) {
            if (value.id == this.bmId) {
              this.SetCurrentMap(value);
              break;
            }
          } else {
            if (value.mode == this.mode) {
              this.SetCurrentMap(value);
              break;
            }
          }
        }
  
        if (!this.currentMap) {
          this.SetCurrentMap(this.bmInfo.maps[0]);
        }
  
        this.bmInfo.maps.forEach((element) => {
          this.AddMode(element.mode);
          if (element.mode === this.mode) {
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
          .get(`https://api.${domain}/get_map_scores`, {
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
  